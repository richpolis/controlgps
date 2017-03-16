angular.module('starter.services', [])
        .service("apiHandler", function ($http, $q, authService) {

            this.executeRequest = function (url, data, method) {

                var baseUrl = 'http://app.controlgps.es/backend/web/index.php/webservices';
                var deferred = $q.defer();
                var endpoint = baseUrl + url;

                console.log("Endpoint: " + endpoint);
                console.log("Data:");
                console.log(JSON.stringify(data));

                $http({
                    method: method || 'GET',
                    data: data || {},
                    dataType: 'json',
                    url: baseUrl + url,
                    headers: {
                        'content-type': 'application/json'
                    }
                }).success(function (data) {
                    deferred.resolve(data);
                }).error(function (data, status) {
                    deferred.reject(data);
                });

                return deferred.promise;
            };

            // Signup
            this.signup = function (data) {
                return this.executeRequest('/user/signup', data);
            };

            // User View
            this.viewUser = function (data) {

                var sufix = "";
                if (typeof data != 'undefined' && typeof data.userId != 'undefined') {
                    suffix = "/" + data.userId;
                } else {
                    suffix = "";
                }
                return this.executeRequest('/user/view' + suffix);
            };

            // Config 
            this.configApp = function () {
                return this.executeRequest('/config', {});
            };

            // News 
            this.newsList = function (data) {
                var url = '/reports?id=' + data.id;
                return this.executeRequest(url, {}, 'GET');
            };

            // ClientList 
            this.clientList = function (data) {
                var url = '/clients?userId=' + data.id;
                return this.executeRequest(url, {}, 'GET');
            };

            // PlatesFromClienteId 
            this.platesFromClienteId = function (data) {
                var url = '/cars?userId=' + data.id;
                return this.executeRequest(url, {}, 'GET');
            };

            // updateCar 
            this.updateCar = function (data) {
                var url = '/updatecar?id=' + data.id + '&install=' + data.install;
                return this.executeRequest(url, {}, 'GET');
            };

            // Videos 
            this.videos = function (data) {
                var url = '/videos?serverId=' + data.Server;
                return this.executeRequest(url, {}, 'GET');
            };




        })
        .factory('authService', function ($http, $q, $log, $state, $timeout, $localstorage) {
            var obj = {};
            obj.user = {};

            obj.setUser = function (user) {
                obj.user = {};
                obj.user = user;
                $localstorage.set('user', user, true);
                return obj.user;
            };

            obj.getUser = function () {
                return obj.user;
            };

            obj.executeRequest = function (url, data, method) {
                var baseUrl = 'http://app.controlgps.es/backend/web/index.php/webservices';
                var deferred = $q.defer();
                var endpoint = baseUrl + url;

                console.log("Endpoint: " + endpoint);
                console.log("Data:");
                console.log(JSON.stringify(data));

                $http({
                    method: method || 'POST',
                    data: data || {},
                    dataType: 'json',
                    url: endpoint,
                    headers: {
                        'content-type': 'application/json'
                    }
                }).success(function (data) {
                    deferred.resolve(data);
                }).error(function (data, status) {
                    deferred.reject(data);
                });

                return deferred.promise;
            };

            obj.login = function (data) {
                var url = '/login?username=' + data.username + '&password=' + data.password
                return obj.executeRequest(url, {}, 'GET');
            };
	
			obj.recuperarPassword = function(data){
           		var url = '/recovery?email=' + data.email;
            	return obj.executeRequest(url, {}, 'GET');
        	};

            obj.getServicioValue = function (servicioName) {
                var servicios = $localstorage.get('configApp', [], true);
                var value = "";
                return $q(function (resolve, reject) {
                    if (servicios.length > 0) {
                        for (var i = 0; i < servicios.length; i++) {
                            if (servicios[i].name == servicioName) {
                                value = servicios[i].value;
                                break;
                            }
                        }
                    }
                    resolve(value);
                });
            }

            obj.getTelefonoServicioContratar = function () {
                return this.getServicioValue('TELEFONO_CONTRATAR_SERVICIO');
            };

            obj.getMovilServicio = function () {
                return this.getServicioValue('MOVIL_SOPORTE');
            };

            obj.getURLVideoTutoriales = function () {
                return this.getServicioValue('URL_VIDEOTUTORIALES');
            };

            obj.init = function () {
                obj.user = $localstorage.get('user', {}, true);
            };

            obj.init();
            return obj;
        })

        .factory('$localstorage', ['$window', function ($window) {
                return {
                    set: function (key, value, isJson) {
                        if (typeof isJson === 'undefined') {
                            isJson = false;
                        }
                        if (isJson) {
                            value = JSON.stringify(value);
                        }
                        if (typeof $window.localStorage != "undefined") {
                            $window.localStorage[key] = value;
                        } else {
                            $window.sessionStorage[key] = value;
                        }
                    },
                    get: function (key, defaultValue, isJson) {
                        if (typeof isJson === 'undefined') {
                            isJson = false;
                        }
                        if (isJson) {
                            if (typeof $window.localStorage != "undefined") {
                                return JSON.parse($window.localStorage[key] || '{}');
                            } else {
                                return JSON.parse($window.sessionStorage[key] || '{}');
                            }
                        } else {
                            if (typeof $window.localStorage != "undefined") {
                                return $window.localStorage[key] || defaultValue;
                            } else {
                                return $window.sessionStorage[key] || defaultValue;
                            }

                        }
                    }
                }
            }])

        .factory('responseObserver', ['$q', '$rootScope', function responseObserver($q, $rootScope) {
                return {
                    // optional method
                    'request': function (config) {
                        $rootScope.showLoader(true);
                        return config;
                    },
                    // optional method
                    'requestError': function (rejection) {
                        // do something on error
                        return $q.reject(rejection);
                    },
                    // optional method
                    'response': function (response) {
                        $rootScope.showLoader(false);
                        return response;
                    },
                    // optional method
                    'responseError': function (rejection) {
                        // do something on error
                        switch (rejection.status) {
                            case 403:
                                $rootScope.error('Tu sesión ha expirado, favor de inciar sesión de nuevo.');
                                $rootScope.showLoader(false);
                                $rootScope.forceLogout();
                                break;
                            case 500:
                                $rootScope.error('Ocurrió un error en el servidor, favor de intentar más tarde.');
                                $rootScope.showLoader(false);
                                break;
                            default:
                                $rootScope.error('Ocurrió un error en la conexión, favor de intentar más tarde. [' + rejection.status + ']');
                                $rootScope.showLoader(false);
                                break;
                        }
                        return $q.reject(rejection);
                    }
                };
            }])
        .factory('jsonUtility', function () {
            return {
                isObjectEmpty: function (obj) {
                    // null and undefined are "empty"
                    if (obj == null)
                        return true;

                    // Otherwise, does it have any properties of its own?
                    // Note that this doesn't handle
                    // toString and valueOf enumeration bugs in IE < 9
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key))
                            return false;
                    }
                    return true;
                }
            }
        })
        .factory('dateUtility', function ($rootScope) {
            return {
                monthName: function (m) {
                    var month = new Array();
                    month[0] = "Ene";
                    month[1] = "Feb";
                    month[2] = "Mar";
                    month[3] = "Abr";
                    month[4] = "May";
                    month[5] = "Jun";
                    month[6] = "Jul";
                    month[7] = "Ago";
                    month[8] = "Sep";
                    month[9] = "Oct";
                    month[10] = "Nov";
                    month[11] = "Dic";

                    if (m >= 0 && m <= 11) {
                        return month[m];
                    }
                    return '??';
                },
                dayName: function (d) {
                    var day = new Array();
                    day[0] = 'Do';
                    day[1] = 'Lu';
                    day[2] = 'Ma';
                    day[3] = 'Mi';
                    day[4] = 'Ju';
                    day[5] = 'Vi';
                    day[6] = 'Sa';

                    if (d >= 0 && d <= 6) {
                        return day[d];
                    }
                    return '??';
                },
                getDateFromString: function (date) {
                    if ($rootScope.isIOS) {
                        return date;
                    } else {
                        var datos = date.split("-");
                        var fecha = new Date(datos[0], datos[1], datos[2]);
                        return fecha;
                    }
                },
                getStringFromDate: function (date) {
                    if ($rootScope.isIOS) {
                        return date;
                    } else {
                        var ano = parseInt(date.getFullYear(), 10);
                        var mes = parseInt(date.getMonth(), 10) + 1;
                        var dia = parseInt(date.getDate(), 10);
                        var string = (dia >= 10 ? dia : "0" + dia) + "\/" + (mes >= 10 ? mes : "0" + mes) + "\/" + ano;
                        return string;
                    }
                },
                getStringFromTime: function (time) {
                    if ($rootScope.isIOS) {
                        return time;
                    } else {
                        var horas = parseInt(time.getHours(), 10);
                        var minutos = parseInt(time.getMinutes(), 10);
                        var string = '';
                        if (horas >= 12 && horas <= 23) {
                            horas = (horas == 12 ? horas : horas - 12);
                            string = (horas >= 10 ? horas : "0" + horas) + ":" + (minutos >= 10 ? minutos : "0" + minutos) + " pm";
                        } else {
                            string = (horas >= 10 ? horas : "0" + horas) + ":" + (minutos >= 10 ? minutos : "0" + minutos) + " am";
                        }
                        return string;
                    }
                }
            }
        })
        ;


