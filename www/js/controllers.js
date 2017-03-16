angular.module('starter.controllers', [])

        .controller('AppCtrl', function ($scope, $rootScope, $ionicModal, $timeout, $localstorage) {

            // With the new view caching in Ionic, Controllers are only called
            // when they are recreated or on app start, instead of every page change.
            // To listen for when this page is active (for example, to refresh data),
            // listen for the $ionicView.enter event:
            //$scope.$on('$ionicView.enter', function(e) {
            //});

            $scope.user = $localstorage.get('user', {}, true);

        })


        .controller('LoginCtrl', function ($scope, $rootScope, $ionicPopup, $ionicModal, $rootScope, $timeout,
                $log, $state, authService, $ionicHistory, $localstorage, apiHandler,
                $cordovaInAppBrowser) {

            $scope.loginData = $localstorage.get('user_user',{username:"",password:"",remember:false},true);
            
            if(!$scope.loginData.remember){
                $scope.loginData.username = "";
                $scope.loginData.password = "";
            }
            
            $scope.services = [];

            var defaultOptions = {
                location: 'no',
                clearcache: 'no',
                toolbar: 'yes',
                toolbarposition: 'top',
                closebuttoncaption: 'Regresar a la app'
            };


            apiHandler.configApp().then(function (result) {
                result.forEach(function (element, index) {
                    if (element.name == "FACEBOOK") {
                        element.clase = "positive";
                        element.icon = "ion-social-facebook";
                        $scope.services.push(element);
                    } else if (element.name == "TWITTER") {
                        element.clase = "twitter";
                        element.icon = "ion-social-twitter";
                        $scope.services.push(element);
                    } else if (element.name == "YOUTUBE") {
                        element.clase = "youtube";
                        element.icon = "ion-social-youtube";
                        $scope.services.push(element);
                    }
                });
                $localstorage.set('configApp', result, {});
            }, function (err) {
                console.log(err);
            })

            // Login function
            $scope.doLogin = function (data) {
                $localstorage.set('user_user', $scope.loginData, true);
                $rootScope.showLoader(true);
                var promise = authService.login($scope.loginData);
                promise.then(function (result) {
                    console.log("Login: ")
                    console.log(JSON.stringify(result));
                    if (!result.hasOwnProperty('User')) {
                        $rootScope.showLoader(false);
                        $rootScope.error("Usuario o contraseña incorrectos");
                    } else {
                        $rootScope.showLoader(false);
                        authService.setUser(result.User);
                        $state.go('app.noticias'); // Default screen after login
                        $ionicHistory.nextViewOptions({disableBack: 'true'});
                        $ionicHistory.clearHistory();
                        $ionicHistory.clearCache();
                    }
                });
            };
            // END login function


            // Creamos un modal para recuperar la contraseña de un usuario
            $ionicModal.fromTemplateUrl('templates/recuperarModal.html', {
                scope: $scope
            }).then(function (modalRecuperar) {
                $scope.modalRecuperar = modalRecuperar;
            });

            $scope.recuperarData = {};

            // Accion para cerrar el formRecuperar
            $scope.closeFormRecuperar = function () {
                $scope.modalRecuperar.hide();
            };

            // Accion para mostrar el formRecuperar
            $scope.showFormRecuperar = function () {
				$scope.recuperarData.email = '';
                $scope.modalRecuperar.show();
            };

            // Perform the login action when the user submits the login form
            $scope.doRecuperar = function () {
                $rootScope.showLoader(true);
                if ($scope.validarEmail($scope.recuperarData.email)) {
                    authService.recuperarPassword($scope.recuperarData).then(function (data) {
						console.log(data);
                        $rootScope.showLoader(false);
                        var alertPopup = $ionicPopup.alert({
                            title: 'Recuperar contraseña!',
                            template: ((data.response == true) ? 'Se han enviado los datos a la direccion proporcionada.':'La dirección de correo electrónico proporcionada no se encontró en nuestros registros.')
                        });
						alertPopup.then(function(res) {
						 if( data.response == true ){
							$scope.closeFormRecuperar();
						 }
					   });
                        
                    }, function (err) {
						console.log(err);
                        //alert("Error: " + JSON.stringify(err));
                        $rootScope.showLoader(false);
                        $ionicPopup.alert({
                            title: 'Recuperar contraseña!',
                            template: err.detail
                        });
                    });
                } else {
                    $rootScope.showLoader(false);
                    $ionicPopup.alert({
                        title: 'Recuperar contraseña!',
                        template: 'La dirección de correo electrónico proporcionada no es válida.'
                    });
                }

            };

            $scope.validarEmail = function (email) {
                var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                return re.test(email);
            }

            $scope.openBrowser = function (service) {
                console.log(JSON.stringify(service))
                //$rootScope.showLoader(true);
                $cordovaInAppBrowser.open(service.value, '_blank', defaultOptions)
                        .then(function (event) {
                            // success
                            //$rootScope.showLoader(false);
                            console.log(event);
                        })
                        .catch(function (event) {
                            // error
                            //$rootScope.showLoader(false);
                            console.log(event);
                        });       
                
                //$rootScope.showLoader(false);
                //window.open(service.value, "_blank","location=yes");
            };

            $scope.llamarSoporteTecnico = function () {
                var telefono = "tel:";
                authService.getTelefonoServicioContratar().then(function (value) {
                    console.log(value);
                    telefono += value;
                    //location.href = telefono;
                    window.open(telefono, "_blank");
                });

            };

            $scope.$watch("loginData.remember",function(oldValue,newValue){
                $localstorage.set('user_user', $scope.loginData, true);
                //$scope.$broadcast('cerrar_session', 'remember');
            });


        })

        .controller('LogoutCtrl', function ($scope, authService, $state, $ionicHistory, $localstorage) {
            authService.setUser({});
            $state.go('login');
            $ionicHistory.nextViewOptions({disableBack: 'true'});
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
        })

        .controller('NoticiasCtrl', function ($scope, $rootScope, apiHandler, jsonUtility,
                authService, $localstorage, $cordovaInAppBrowser) {
            if (typeof authService.getUser() === "undefined" || jsonUtility.isObjectEmpty(authService.getUser())) {
                $rootScope.forceLogout();
            }

            var defaultOptions = {
                location: 'no',
                clearcache: 'no',
                toolbar: 'yes',
                toolbarposition: 'top',
                closebuttoncaption: 'Regresar a la app'
            };


            $scope.user = $localstorage.get('user', {}, true);
            $scope.noticias = $localstorage.get('noticias', [], true);
            $rootScope.showLoader(true);
            apiHandler.newsList($scope.user).then(function (result) {
                $rootScope.showLoader(false);
                $scope.noticias = result;
                $localstorage.set('noticias', $scope.noticias, true);
            }, function (err) {
                $rootScope.showLoader(false);
                console.log(err);
            });

            $scope.llamarSoporteTecnico = function () {
                var telefono = "tel:";
                authService.getTelefonoServicioContratar().then(function (value) {
                    console.log(value);
                    telefono += value;
                    //location.href = telefono;
                    window.open(telefono, "_blank");
                });

            };


            $scope.openBrowser = function (url) {
                console.log(JSON.stringify(url))
                //$rootScope.showLoader(true);
                $cordovaInAppBrowser.open(url, '_blank', defaultOptions)
                        .then(function (event) {
                            // success
                            //$rootScope.showLoader(false);
                            console.log(event);
                        })
                        .catch(function (event) {
                            // error
                            //$rootScope.showLoader(false);
                            console.log(event);
                        });
                // $rootScope.showLoader(false);
                // window.open(url, "_blank","location=yes");
            };

        })

        .controller('NoticiaCtrl', function ($scope, $stateParams, $localstorage, authService) {
            $scope.noticiaId = $stateParams["noticiaId"];
            $scope.noticias = $localstorage.get('noticias', [], true);
            $scope.noticia = {};
            $scope.noticias.forEach(function (element, index) {
                if (index == $scope.noticiaId) {
                    $scope.noticia = element;
                }
            });

            $scope.llamarSoporteTecnico = function () {
                var telefono = "tel:";
                authService.getTelefonoServicioContratar().then(function (value) {
                    console.log(value);
                    telefono += value;
                    //location.href = telefono;
                    window.open(telefono, "_blank");
                });

            };

        })

        .controller('ClientesCtrl', function ($scope, $rootScope, apiHandler, jsonUtility, authService,
                $localstorage, $ionicModal, $cordovaSms, $ionicPopup, $state) {
            if (typeof authService.getUser() === "undefined" || jsonUtility.isObjectEmpty(authService.getUser())) {
                $rootScope.forceLogout();
            }
            $scope.user = $localstorage.get('user', {}, true);
            
            $rootScope.showLoader(true);
            apiHandler.clientList($scope.user).then(function (result) {
                $rootScope.showLoader(false);
                console.log(result);
                $scope.clients = result;
                $localstorage.set('clients', $scope.clients, true);
            }, function (err) {
                $rootScope.showLoader(false);
                console.log(err);
            });

            $scope.llamarSoporteTecnico = function () {
                var telefono = "tel:";
                authService.getTelefonoServicioContratar().then(function (value) {
                    console.log(value);
                    telefono += value;
                    location.href = telefono;
                });
            };

            $scope.viewCliente = function (cliente) {
                $state.go('app.cliente', {
                    clienteId: cliente.id
                });
            };

        })

        .controller('MatriculasCtrl', function ($scope, $rootScope, apiHandler, jsonUtility, authService,
                $localstorage, $ionicModal, $cordovaSms, $ionicPopup, $stateParams) {
            if (typeof authService.getUser() === "undefined" || jsonUtility.isObjectEmpty(authService.getUser())) {
                $rootScope.forceLogout();
            }

            if($stateParams.clienteId == 0){
                $scope.user = $localstorage.get('user', {}, true);
                $scope.userOrigin = $localstorage.get('user', {}, true);
            }else{
                $scope.userOrigin = $localstorage.get('user', {}, true);
                var clientes = $localstorage.get('clients', {}, true);
                for(var cont=0; cont<clientes.length;cont++){
                    if($stateParams.clienteId==clientes[cont].id){
                        $scope.user = clientes[cont];
                        break;
                    }
                }
            }

            $scope.plates = [];

            var options = {
              replaceLineBreaks: false, // true to replace \n by a new line, false by default
              android: {
                intent: ''
                //intent: 'INTENT'  // send SMS with the default SMS app
                //intent: ''        // send SMS without open any other app
              }
            };

            $rootScope.showLoader(true);
            apiHandler.platesFromClienteId($scope.user).then(function (result) {
                $rootScope.showLoader(false);
                console.log(result);
                $scope.plates = result;
                $localstorage.set('plates', $scope.plates, true);
            }, function (err) {
                $rootScope.showLoader(false);
                console.log(err);
            });

            // Modal para visualizar carro
            $ionicModal.fromTemplateUrl('templates/matriculaModal.html', {
                scope: $scope
            }).then(function (modalMatricula) {
                $scope.modalMatricula = modalMatricula;
            });

            $scope.matriculaData = {};

            // Accion para cerrar el formMatricula
            $scope.closeFormMatricula = function () {
                $scope.modalMatricula.hide();
            };

            // Accion para mostrar el formMatricula
            $scope.showFormMatricula = function (plate) {
                $scope.plateActual = plate;
                $scope.modalMatricula.show();
            };



            $scope.llamarSoporteTecnico = function () {
                var telefono = "tel:";
                authService.getTelefonoServicioContratar().then(function (value) {
                    console.log(value);
                    telefono += value;
                    location.href = telefono;
                });

            };


            $scope.smsEncendido = function () {
                
                $rootScope.showLoader(true);
                $cordovaSms
                    .send($scope.plateActual.telephone_number, $scope.plateActual.device.ON_IBUTTON, options)
                        .then(function () {
                            // Success! SMS was sent
                            $rootScope.showLoader(false);
                            $rootScope.showMessage("SMS Enviado");
                        }, function (error) {
                            // An error occurred
                            $rootScope.showLoader(false);
                            $rootScope.error("SMS no fue enviado");
                        });
            };

            $scope.smsApagado = function () {
                $rootScope.showLoader(true);
                $cordovaSms
                    .send($scope.plateActual.telephone_number, $scope.plateActual.device.OFF_IBUTTON, options)
                        .then(function () {
                            // Success! SMS was sent
                            $rootScope.showLoader(false);
                            $rootScope.showMessage("SMS Enviado");
                            
                        }, function (error) {
                            // An error occurred
                            $rootScope.showLoader(false);
                            $rootScope.error("SMS no fue enviado");
                        });
            };

            $scope.smsReiniciar = function () {
                $rootScope.showLoader(true);
                $cordovaSms
                    .send($scope.plateActual.telephone_number, $scope.plateActual.device.RESET_GPS, options)
                        .then(function () {
                             // Success! SMS was sent
                            $rootScope.showLoader(false);
                            $rootScope.showMessage("SMS Enviado");
                            
                        }, function (error) {
                            // An error occurred
                            $rootScope.showLoader(false);
                            $rootScope.error("SMS no fue enviado");
                        });
            };

            $scope.editInstall = function(car){
                $ionicPopup.prompt({
                    title: 'Editar Instalacion',
                    template: 'Ingresa la forma de instalacion',
                    inputType: 'text',
                    inputPlaceholder: 'install'
                }).then(function(res) {
                    console.log('Change ', res);
                    if(res){
                        car.install = res;
                        $rootScope.showLoader(true);
                        apiHandler.updateCar(car).then(function (result) {
                            $rootScope.showLoader(false);
                            console.log(result);
                            $scope.plateActual.install = result.install;
                            for(var cont=0; cont<$scope.plates.length;cont++){
                                if($scope.plates[cont].id==result.id){
                                    $scope.plates[cont]=$scope.plateActual;
                                    break;
                                }
                            }
                        }, function (err) {
                            $rootScope.showLoader(false);
                            console.log(err);
                        });
                    }

                });
            }

        })

        .controller('VideosCtrl', function ($scope, $rootScope, apiHandler, jsonUtility, authService, $localstorage, $ionicModal) {
            if (typeof authService.getUser() === "undefined" || jsonUtility.isObjectEmpty(authService.getUser())) {
                $rootScope.forceLogout();
            }
            $scope.user = $localstorage.get('user', {}, true);
            $scope.videos = [];
            $rootScope.showLoader(true);
            if ($scope.user.Server) {
                apiHandler.videos($scope.user).then(function (result) {
                    $rootScope.showLoader(false);
                    console.log(result);
                    result.forEach(function (element, index) {
                        element.link_youtube = element.link_youtube.replace("watch?v=", "embed/");
                        $scope.videos.push(element);
                    });
                    $localstorage.set('videos', $scope.videos, true);
                }, function (err) {
                    $rootScope.showLoader(false);
                    console.log(err);
                });
            } else {
                $rootScope.showLoader(false);
            }

            // Modal para visualizar video
            $scope.crearModalVideo = function(){
                $ionicModal.fromTemplateUrl('templates/videoModal.html', {
                    scope: $scope
                }).then(function (modalVideo) {
                    $scope.modalVideo = modalVideo;
                });
            }

            $scope.crearModalVideo();

            $scope.videoData = {};

            // Accion para cerrar el formVideo
            $scope.closeFormVideo = function () {
                $scope.modalVideo.hide();
                $scope.modalVideo.remove();
                $scope.crearModalVideo();
            };

            // Accion para mostrar el formVideo
            $scope.showFormVideo = function (video) {
                $scope.videoActual = video;
                $scope.modalVideo.show();
            };



            $scope.llamarSoporteTecnico = function () {
                var telefono = "tel:";
                authService.getTelefonoServicioContratar().then(function (value) {
                    console.log(value);
                    telefono += value;
                    //location.href = telefono;
                    window.open(telefono, "_blank");
                });

            };

        })

        ;
