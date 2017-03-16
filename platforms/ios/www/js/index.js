var licencePlates = [];
var userInfo = {};
var config = {};

var previousPage = '';
var currentPage = '';

var clickDelay = 250, clickDelayTimer = null;

var bindEvents = true;

var permissions = null;

alertify.defaults.glossary.ok = 'Aceptar';
alertify.defaults.glossary.cancel = 'Cancelar';

function validEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function callNumberPhoneDialer(number) {
    console.log("*** Calling to " + number);
    phonedialer.dial(
            number,
            function (err) {
                if (err == "empty") {
                    console.log("Unknown phone number");
                    return "Unknown phone number";
                } else {
                    console.log("Dialer Error:" + err);
                    return "Error:" + err;
                }
            },
            function (success) {
                return '';
            }
    );
}

function callNumber(number) {
    if (device.platform == 'Android' && parseFloat(device.version) >= 5.0) {
        permissions.requestPermission(permissions.CALL_PHONE, function () {
            callNumberPhoneDialer(number);
        }, function () {
            displayMsg("Se necesitan permisos para realizar llamadas.");
        });
    } else {
        callNumberPhoneDialer(number);
    }
    callNumberPhoneDialer(number);
}

function displayMsg(msg) {
    alertify.alert(msg);
}

function sendSMS(parameters) {
    if (!parameters.hasOwnProperty('options')) {
        parameters.options = {};
    }
    if (!parameters.hasOwnProperty('onSuccess')) {
        parameters.onSuccess = function () {};
    }
    if (!parameters.hasOwnProperty('onError')) {
        parameters.onError = function () {};
    }
    sms.send(parameters.number, parameters.message, parameters.options, parameters.onSuccess, parameters.onError);
}

function loadNews() {
    $.ajax({
        type: 'GET',
        url: 'http://app.controlgps.es/backend/web/index.php/webservices/reports?id=' + userInfo.id,
        dataType: 'json'
    }).done(function (data, textStatus, jqXHR) {
        var json = jqXHR.responseJSON;
        $("#notices").empty();
        for (var i = 0; i < json.length; i++) {
            var notice = json[i];
            var style = '';
            switch (notice.type) {
                case 'Rojo':
                    style = 'border-left: 4px solid #ED5565;';
                    break;
                case 'Verde':
                    style = 'border-left: 4px solid rgb(63, 186, 155);';
                    break;
                case 'Blanco':
                    style = 'border-left: 4px solid #F5F7FA;';
                    break;
            }
            $("#notices").append('<div class="panel"> <div class="panel-heading"> <h4 class="panel-title" style="' + style + '"> <p style="font-size: 11px; font-style: italic; padding: 10px 0px 0px 15px;">' + notice.created_at + '</p> <a aria-expanded="false" class="" data-toggle="collapse" data-parent="#notices" style="text-transform: none; padding-top: 0px;" href="#notice' + i + '"> ' + notice.title + ' <span class="pull-right"><i class="fa fa-chevron-right" aria-hidden="true"></i><i class="fa fa-chevron-down" aria-hidden="true" style="display: none;"></i></span> </a> </h4> </div> <div id="notice' + i + '" class="panel-collapse collapse"> <div class="panel-body" style="text-transform: none;"> ' + notice.description + ' </div> </div> </div>');
        }
        $("#noticesTitle").removeClass('hidden');
    });
}

function displaySearchBar() {
    if (!$("#pag3 div[data-role=header]").hasClass('search-header')) {
        $("#titleHeader").fadeOut(225);
        setTimeout(function () {
            $("#pag3 div[data-role=header]").addClass('search-header');
            $("#searchHeader").fadeIn(225);
        }, 250);
    }
}

function hideSearchBar() {
    if ($("#pag3 div[data-role=header]").hasClass('search-header')) {
        $("#searchHeader").fadeOut(225);
        setTimeout(function () {
            $("#pag3 div[data-role=header]").removeClass('search-header');
            $("#titleHeader").fadeIn(225);
        }, 250);
    }
}

function loadLicencePlatesFromUserID(id) {
    $.ajax({
        type: 'GET',
        url: 'http://app.controlgps.es/backend/web/index.php/webservices/cars?userId=' + id,
        dataType: 'json'
    }).done(function (data, textStatus, jqXHR) {
        var json = jqXHR.responseJSON;
        licencePlates = json;

        $("#licence_plates").html('<p style="margin-bottom: 10px; margin-top: 15px; text-transform: none; font-size: 13px; margin-left: 14px; font-weight: bold; color: rgb(88, 97, 110);">Matrículas</p>');
        var html = '<div id="licence_plates_list" class="list-group" style="text-transform: none;">';
        json.forEach(function (value, index) {
            html += '<a href="javascript: void(0);" data-id="' + value.id + '" data-action="view-licence-plate" class="list-group-item">' + value.enrollment + '</a>';
        });
        html += '</div></div>';
        $("#licence_plates").append(html);

        $("#licence_plates_loader").addClass('hidden');

        $("a[data-action=view-licence-plate]").click(function () {
            var id = $(this).attr('data-id');
            var data = null;
            for (var i = 0; i < licencePlates.length; i++) {
                var row = licencePlates[i];
                if (row.id == id) {
                    data = row;
                    break;
                }
            }
            if (data != null) {
                $("#licencePlateTitle").text(data.device.name);

                $("#infoMatriculaPlateName").text(data.enrollment);
                $("#infoLicencePlateName").text(data.licence);
                $("#infoLicencePlateNumber").text(data.telephone_number);
                $("#infoLicencePlateInstallationPlace").text(data.install);
                $("#infoLicencePlateModifyInstallationPlace").attr('data-target', data.id);

                if (data.hasIbutton == 1) {
                    $("#ibuttonActions").removeClass('hidden');
                    $("#btnPowerOn").off().click(function () {
                        $("#deviceActions button").addClass('disabled');
                        sendSMS({
                            number: data.telephone_number,
                            message: data.device.ON_IBUTTON,
                            onSuccess: function () {
                                displayMsg('Mensaje enviado');
                                $("#deviceActions button").removeClass('disabled');
                            },
                            onError: function () {
                                displayMsg('Mensaje no enviado');
                                $("#deviceActions button").removeClass('disabled');
                            }
                        });
                    });
                    $("#btnPowerOff").off().click(function () {
                        $("#deviceActions button").addClass('disabled');
                        sendSMS({
                            number: data.telephone_number,
                            message: data.device.OFF_IBUTTON,
                            onSuccess: function () {
                                displayMsg('Mensaje enviado');
                                $("#deviceActions button").removeClass('disabled');
                            },
                            onError: function () {
                                displayMsg('Mensaje no enviado');
                                $("#deviceActions button").removeClass('disabled');
                            }
                        });
                    });
                } else {
                    $("#ibuttonActions").addClass('hidden');
                }

                $("#btnRebootGPS").off().click(function () {
                    $("#deviceActions button").addClass('disabled');
                    sendSMS({
                        number: data.telephone_number,
                        message: data.device.RESET_GPS,
                        onSuccess: function () {
                            displayMsg('Mensaje enviado');
                            $("#deviceActions button").removeClass('disabled');
                        },
                        onError: function () {
                            displayMsg('Mensaje no enviado');
                            $("#deviceActions button").removeClass('disabled');
                        }
                    });
                });
            }
            $("#pag3").addClass('hidden');
            $("#containerViewLicencePlate").fadeIn('fast');
        });
    });
}

function loadClientList(id) {
    $.ajax({
        type: 'GET',
        url: 'http://app.controlgps.es/backend/web/index.php/webservices/clients?userId=' + id,
        dataType: 'json'
    }).done(function (data, textStatus, jqXHR) {
        var json = jqXHR.responseJSON;
        licencePlates = json;

        $("#licence_plates").html('<p style="margin-bottom: 10px; margin-top: 15px; text-transform: none; font-size: 13px; margin-left: 14px; font-weight: bold; color: rgb(88, 97, 110);">Clientes</p>');
        var html = '<div id="client_list" class="list-group" style="text-transform: none;">';
        json.forEach(function (value, index) {
            html += '<a href="javascript: void(0);" data-id="' + value.id + '" data-action="view-client" class="list-group-item">' + value.username + '</a>';
        });
        html += '</div></div>';
        $("#licence_plates").append(html);

        $("#licence_plates_loader").addClass('hidden');

        $("a[data-action=view-client").click(function () {
            var id = $(this).attr('data-id');
            var data = null;
            for (var i = 0; i < licencePlates.length; i++) {
                var row = licencePlates[i];
                if (row.id == id) {
                    data = row;
                    break;
                }
            }
            if (data != null) {
                loadLicencePlatesFromUserID(data.id);
            }
        });
    });
}

function loadLicencePlates() {
    $("#licence_plates_loader").removeClass('hidden');
    $("#licence_plates").empty();
    if (userInfo.Rol == 'TECHNICAL') {
        loadClientList(userInfo.id);
        $("#licence_plates_loader").addClass('hidden');
        $("#infoLicencePlateModifyInstallationPlace").show();
        $("#fgPhone").show();
        $("#fgInstallation").show();
        /*$("#btnPowerOn").show();
         $("#btnPowerOff").show();*/
    } else {
        loadLicencePlatesFromUserID(userInfo.id);
        $("#infoLicencePlateModifyInstallationPlace").hide();
        $("#fgPhone").hide();
        $("#fgInstallation").hide();
        /*$("#btnPowerOn").hide();
         $("#btnPowerOff").hide();*/
    }
}

function search() {
    var search = $("#inputSearch").val();
    var count = 0;
    $("#licence_plates").addClass('hidden');
    $("#licence_plates_loader").removeClass('hidden');
    $("#msgSearchResults").remove();

    if ($("#licence_plates").find("#client_list").length > 0) {
        licencePlates.forEach(function (element, index) {
            if (element.username.toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) != -1) {
                $("a[data-id=" + element.id + "][data-action=view-client]").show();
                count++;
            } else {
                $("a[data-id=" + element.id + "][data-action=view-client]").hide();
            }
        });
    } else {
        licencePlates.forEach(function (element, index) {
            if (element.licence.toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) != -1) {
                $("a[data-id=" + element.id + "][data-action=view-licence-plate]").show();
                count++;
            } else {
                $("a[data-id=" + element.id + "][data-action=view-licence-plate]").hide();
            }
        });
    }

    if (count == 0) {
        $("#licence_plates").append('<p id="msgSearchResults" style="display: block;" class="list-group-item">Sin coincidencias para <b>' + search + '</b></p>');
    }
    $("#licence_plates").removeClass('hidden');
    $("#licence_plates_loader").addClass('hidden');
}

function run() {
    setTimeout(function () {
        if (localStorage.getItem("username") && localStorage.getItem("username") != "null" && localStorage.getItem("password") && localStorage.getItem("password") != "null") {
            $("#username").val(localStorage.getItem("username"));
            $("#password").val(localStorage.getItem("password"));
            $("#checkRememberPassword").attr('checked', true);
        } else {
            localStorage.setItem("username", null);
            localStorage.setItem("password", null);
            $("#checkRememberPassword").attr('checked', false);
        }
        try {
            permissions = cordova.plugins.permissions;
        } catch (Error) {
        }
        $("#pag1").removeClass('ui-page-active');
        $("#pag2").addClass('ui-page-active');
        $("#pag2").fadeIn();
        $("#btnLogin").click(function () {
            var user = $("#username").val();
            var pass = $("#password").val();
            if (user == '') {
                displayMsg("El nombre de usuario es requerido.");
            } else if (pass == '') {
                displayMsg("La contraseña es requerida.");
            } else {
                $("#btnLogin").addClass('disabled');
                $.ajax({
                    type: 'GET',
                    url: 'http://app.controlgps.es/backend/web/index.php/webservices/login?username=' + user + '&password=' + pass,
                    dataType: 'json'
                }).done(function (data, textStatus, jqXHR) {
                    console.log("Data: " + JSON.stringify(data));
                    console.log("TextStatus: " + JSON.stringify(textStatus));
                    console.log("jqXHR: " + JSON.stringify(jqXHR));    
                    var json = jqXHR.responseJSON;
                    if (json) {
                        if (json.hasOwnProperty('User')) {
                            userInfo = json.User;
                            if ($("#checkRememberPassword:checked").length > 0) {
                                localStorage.setItem("username", user);
                                localStorage.setItem("password", pass);
                            }
                            loadNews();
                            $("#pag2").removeClass('ui-page-active');
                            $("#pag3").addClass('ui-page-active');

                            if (bindEvents) {
                                $('#jsi-nav').sidebar({
                                    scrollbarDisplay: false,
                                    pullCb: function () {
                                        $('#jsi-nav').addClass('hidden');
                                    }
                                });

                                $(".openerMenu").click(function () {
                                    var $burger = $(this).find('.burger-click-region');
                                    if ($('#jsi-nav').hasClass('hidden')) {
                                        $('#jsi-nav').removeClass('hidden');
                                        $('#jsi-nav').data('sidebar').push();
                                    } else {
                                        $('#jsi-nav').data('sidebar').pull();
                                    }
                                });

                                $("a[data-action=open-page]").click(function () {
                                    var target = $(this).attr('data-target-page');

                                    $(".current-sub-page").hide();
                                    $("#" + target).show();
                                    $("#" + target).addClass('current-sub-page');
                                    $("#main-menu li a").removeClass('current');
                                    $(this).addClass('current');
                                    $("#" + target).html('<div class="text-center"><img style="" src="img/preloader.gif" alt=""> </div>');

                                    if (target == 'licence_plates') {
                                        setTimeout(function () {
                                            displaySearchBar();
                                        }, 750);
                                    } else {
                                        setTimeout(function () {
                                            hideSearchBar();
                                        }, 750);
                                    }

                                    $(".openerMenu .burger-click-region").removeClass('active');
                                    $("#pag3").removeClass('jsc-sidebar-pushed');
                                    $("#pag3").removeClass('jsc-sidebar-scroll-disabled');
                                    $("#pag3").removeClass('jsc-sidebar-push-end');

                                    switch (target) {
                                        case 'news':
                                            $('#jsi-nav').data('sidebar').pull();
                                            $("#news").html('<p id="noticesTitle" class="hidden" style="margin-bottom: 10px; margin-top: 15px; text-transform: none; font-size: 13px; margin-left: 14px; font-weight: bold; color: rgb(88, 97, 110);">Noticias</p> <div class="panel-group panel-group-lists collapse in" id="notices"> <div class="text-center"><img style="" src="img/preloader.gif" alt=""> </div> </div> <div style="position: fixed; bottom: 0px; margin-bottom: 45px; width: 100%;" class="container-fluid"> <button id="btnManageFleet" class="btn btn-block"> <div style="padding-left: 5px;" class="col-xs-1"> <i style="" class="fa fa-car" aria-hidden="true"></i> </div> <div class="col-xs-10" style=""> GESTIONAR FLOTA </div> </button> </div>');
                                            loadNews();
                                            $("#btnManageFleet").click(function () {
                                                window.location.assign(userInfo.url);
                                            });
                                            break;
                                        case 'licence_plates':
                                            $('#jsi-nav').data('sidebar').pull();
                                            loadLicencePlates();
                                            break;
                                        case 'videos':
                                            $('#jsi-nav').data('sidebar').pull();
                                            if (userInfo.Server) {
                                                $.ajax({
                                                    type: 'GET',
                                                    url: 'http://app.controlgps.es/backend/web/index.php/webservices/videos?serverId=' + userInfo.Server,
                                                    dataType: 'json'
                                                }).done(function (data, textStatus, jqXHR) {
                                                    var json = jqXHR.responseJSON;
                                                    $("#videos").empty();
                                                    $("#videos").html('<p id="videosTitle" style="margin-bottom: 10px; margin-top: 15px; text-transform: none; font-size: 13px; margin-left: 14px; font-weight: bold; color: rgb(88, 97, 110);">Videos</p>');
                                                    var html = '<div class="list-group" style="text-transform: none;">';
                                                    json.forEach(function (value, index) {
                                                        html += '<a href="javascript: void(0);" data-link="' + value.link_youtube + '" data-title="' + value.name + '" data-description="' + value.description + '" data-action="view-video" class="list-group-item">' + value.name + ' <span class="pull-right" style="font-size: 11px;font-style: italic;">' + value.created_at + '</span></a>';
                                                    });
                                                    html += '</div>';
                                                    $("#videos").append(html);
                                                    $("a[data-action=view-video]").click(function () {
                                                        var title = $(this).attr('data-title');
                                                        var description = $(this).attr('data-description');
                                                        var link = $(this).attr('data-link').replace('/watch?v=', '/embed/');
                                                        $("#videoTitle").text(title);
                                                        $("#videoDescription").text(description);
                                                        $("#videoFrame").attr('src', link);
                                                        $("#pag3").addClass('hidden');
                                                        $("#containerViewVideo").fadeIn('fast');
                                                    });
                                                });
                                            } else {
                                                $("#videos").empty();
                                                $("#videos").html('<p id="videosTitle" style="margin-bottom: 10px; margin-top: 15px; text-transform: none; font-size: 13px; margin-left: 14px; font-weight: bold; color: rgb(88, 97, 110);">Videos</p>');
                                            }
                                            break;
                                        case 'login':
                                            $(this).removeClass('current');
                                            setTimeout(function () {
                                                $("#pag3").removeClass('ui-page-active');
                                                $("#pag2").addClass('ui-page-active');
                                                $("#btnLogin").removeClass('disabled');
                                                $("#login").hide();
                                                $("#notices").html('<div class="text-center"><img style="" src="img/preloader.gif" alt=""> </div>');
                                                $("#news").addClass('current-sub-page');
                                                $("#news").show();
                                                $("#main-menu li a[data-target-page=news]").addClass('current');
                                                $('#jsi-nav').data('sidebar').pull();
                                            }, 1000);
                                            break;
                                    }
                                });
                                $("#infoLicencePlateModifyInstallationPlace").click(function () {
                                    var id = $(this).attr('data-target');
                                    alertify.prompt('Ingrese el nuevo valor', '', function (evt, value) {
                                        if (value == '') {
                                            displayMsg("El campo no puede estar vacío.");
                                        } else {
                                            $.ajax({
                                                type: 'GET',
                                                url: 'http://app.controlgps.es/backend/web/index.php/webservices/updatecar?id=' + id + '&install=' + value,
                                                dataType: 'json'
                                            }).done(function (data, textStatus, jqXHR) {
                                                var json = jqXHR.responseJSON;
                                                if (json.install == value) {
                                                    $("#infoLicencePlateInstallationPlace").text(value);
                                                    displayMsg('Valor cambiado con éxito.');
                                                }
                                            });
                                        }
                                    });
                                });
                                bindEvents = false;
                            }

                        } else {
                            displayMsg("Usuario o contraseña incorrectos");
                            $("#btnLogin").removeClass('disabled');
                        }
                    }
                });
            }
        });
        $("#btnHireService").click(function () {
            var tlf = '';
            config.forEach(function (element, index) {
                if (element.name == "TELEFONO_CONTRATAR_SERVICIO") {
                    tlf = element.value;
                }
            });
            callNumber(tlf);
        });
        $("#btnManageFleet").click(function () {
            window.location.assign(userInfo.url);
        });
        $("#btnSupport").click(function () {
            var tlf = '';
            config.forEach(function (element, index) {
                if (element.name == "TELEFONO_SOPORTE") {
                    tlf = element.value;
                }
            });
            callNumber(tlf);
        });
        $("#btnRecoverPassword").click(function () {
            $("#pag2").addClass('hidden');
            $("#containerRecoverPassword").fadeIn('fast');
        });
        $("#btnHideContainerRecoverPassword").click(function () {
            $("#containerRecoverPassword").fadeOut('fast');
            setTimeout(function () {
                $("#pag2").removeClass('hidden');
            }, 500);
        });
        $("#btnHideContainerViewVideo").click(function () {
            $("#containerViewVideo").fadeOut('fast');
            setTimeout(function () {
                $("#pag3").removeClass('hidden');
            }, 500);
        });
        $("#btnHideContainerViewLicencePlate").click(function () {
            $("#containerViewLicencePlate").fadeOut('fast');
            setTimeout(function () {
                $("#pag3").removeClass('hidden');
            }, 500);
        });
        $("#btnRecoverPasswordAction").click(function () {
            var email = $("#mailRecoverPassword").val();
            if (email == '') {
                displayMsg("La dirección de correo electrónico está vacía.");
            } else {
                if (validEmail(email)) {
                    $("#btnRecoverPasswordAction").addClass('disabled');
                    $.ajax({
                        type: 'GET',
                        url: 'http://app.controlgps.es/backend/web/index.php/webservices/recovery?email=' + email,
                        dataType: 'json'
                    }).done(function (data, textStatus, jqXHR) {
                        var json = jqXHR.responseJSON;
                        $("#btnRecoverPasswordAction").removeClass('disabled');
                        if (json) {
                            if (json.response) {
                                displayMsg("Se han enviado los datos a la direccion proporcionada.");
                                $("#mailRecoverPassword").val('');
                                $('#modalRecoverPassword').modal('hide');
                            } else {
                                displayMsg("La dirección de correo electrónico proporcionada no se encontró en nuestros registros.");
                            }
                        }
                    });
                } else {
                    displayMsg("La dirección de correo electrónico proporcionada no es válida.");
                }
            }
        });
        //$("#btnLogin").click();
        //}, 250);
    }, 1250);
}

function runOnDeviceReady() {
    $("#pag1").off();
    $.ajax({
        type: 'GET',
        url: 'http://app.controlgps.es/backend/web/index.php/webservices/config',
        dataType: 'json'
    }).done(function (data, textStatus, jqXHR) {
        var json = jqXHR.responseJSON;
        config = json;

        config.forEach(function (element, index) {
            if (element.name == "FACEBOOK") {
                $("#aFB").attr('href', element.value);
            }
            if (element.name == "TWITTER") {
                $("#aTwitter").attr('href', element.value);
            }
            if (element.name == "YOUTUBE") {
                $("#aYouTube").attr('href', element.value);
            }
        });

        run();
    });
}

var app = {
    // Application Constructor
    initialize: function () {
        this.bindEvents();
        //runOnDeviceReady();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function () {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function () {
        //alert("onDeviceReady");
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function (id) {
        console.log(id);
        switch (id) {
            case 'deviceready':
                runOnDeviceReady();
                break;
        }
    }
};