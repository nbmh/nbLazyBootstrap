/* global angular */

/**
 * Bootstrapping angular project with lazy loading support
 * 
 * @param {Object} angular
 * @returns {void}
 */
(function(angular) {
  'use strict';
  
  var options = {
    name: 'app',
    modules: [],
    directive: [],
    service: [],
    filter: [],
    vendor: [],
    external: [],
    version: '',
    lazy: {
      cache: true,
      timeout: 60000,
      reconfig: false,
      rerun: false,
      serie: false,
      insertBefore: 'body>*:last-child'
    },
    directory: {
      modules: 'module',
      controllers: 'controller',
      directives: 'directive',
      components: 'component',
      services: 'service',
      filters: 'filter',
      views: 'view',
      vendors: 'vendor'
    }
  },
  promises = [],
  modules = {
    names: [],
    configs: []
  },
  callbacks = {
    loading: angular.noop,
    error: angular.noop,
    done: angular.noop,
    config: angular.noop,
    run: angular.noop
  },
  lib = {
    toArray: function(arr) {
      if (!arr) {
        return [];
      }
      return angular.isArray(arr) ? arr : [arr];
    },
    bootstrap: function(app) {
      angular.element(document).ready(function () {
        angular.bootstrap(document, [app.name]);
      });
    },
    injector: function(modules) {
      var modulesList = ['ng'];
      return angular.injector(modulesList);
    },
    getVersionPrefix: function() {
      return options.version != '' ? '?_=' + options.version : '';
    },
    toCamelCase: function(str) {
      return str.toLowerCase().replace(/-(.)/g, function(match, group1) {
        return group1.toUpperCase();
      });
    }
  };
  
  angular.lazy = function(opt) {
    
    options = angular.merge(options, opt || {});
    
    if (options.modules.indexOf('oc.lazyLoad') == -1) {
      options.modules.unshift('oc.lazyLoad');
    }
    
    var $injector = lib.injector(options.modules),
    $q = $injector.get('$q'),
    $timeout = $injector.get('$timeout');
    
    return {
      module: function(name, config) {
        if (config != undefined) {
          var moduleName = name.toLowerCase();
          if (modules.names.indexOf(moduleName) == -1) {
            modules.names.push(moduleName);
            modules.configs.push(angular.extend(config, {name: moduleName}));
          }
          return this;
        } else {
          return angular.module(name.toLowerCase());
        }
      },
      resolve: function(promise) {
        promise = $q.when($injector.instantiate(promise));
        promises.push(promise);
        return this;
      },
      loading: function(callback) {
        callbacks.loading = callback;
        return this;
      },
      error: function(callback) {
        callbacks.error = callback;
        return this;
      },
      done: function(callback) {
        callbacks.done = callback;
        return this;
      },
      config: function(callback) {
        callbacks.config = callback;
        return this;
      },
      run: function(callback) {
        callbacks.run = callback;
        return this;
      },
      bootstrap: function(callback) {
        callbacks.loading();

        var appModule, appConfig, 
        appModules = [],
        moduleConfig = [],
        toLoad = [],
        toLoadConfig = function(baseConfig, config) {
          return angular.merge(angular.copy(baseConfig), config);
        },
        toLoadCopy = function(moduleDirectory, toLoad, config) {
          var nextLevel = angular.copy(toLoad);

          if (config.component != undefined && config.component.length) {
            angular.forEach(config.component, function(name) {
              var path;
              if (angular.isObject(name)) {
                path = options.directory.modules + '/' + name.module + '/' + options.directory.components + '/' + lib.toCamelCase(name.name) + '.js' + lib.getVersionPrefix();
              } else {
                path = moduleDirectory + '/' + options.directory.components + '/' + lib.toCamelCase(name) + '.js' + lib.getVersionPrefix();
              }
              nextLevel.push(path);
            });
          }
          if (config.directive != undefined && config.directive.length) {
            angular.forEach(config.directive, function(name) {
              var path;
              if (angular.isObject(name)) {
                path = options.directory.modules + '/' + name.module + '/' + options.directory.directives + '/' + lib.toCamelCase(name.name) + '.js' + lib.getVersionPrefix();
              } else {
                path = moduleDirectory + '/' + options.directory.directives + '/' + lib.toCamelCase(name) + '.js' + lib.getVersionPrefix();
              }
              nextLevel.push(path);
            });
          }
          if (config.service != undefined && config.service.length) {
            angular.forEach(config.service, function(name) {
              var path;
              if (angular.isObject(name)) {
                path = options.directory.modules + '/' + name.module + '/' + options.directory.services + '/' + lib.toCamelCase(name.name) + '.js' + lib.getVersionPrefix();
              } else {
                path = moduleDirectory + '/' + options.directory.services + '/' + lib.toCamelCase(name) + '.js' + lib.getVersionPrefix();
              }
              nextLevel.push(path);
            });
          }
          if (config.filter != undefined && config.filter.length) {
            angular.forEach(config.filter, function(name) {
              var path;
              if (angular.isObject(name)) {
                path = options.directory.modules + '/' + name.module + '/' + options.directory.filters + '/' + lib.toCamelCase(name.name) + '.js' + lib.getVersionPrefix();
              } else {
                path = moduleDirectory + '/' + options.directory.filters + '/' + lib.toCamelCase(name) + '.js' + lib.getVersionPrefix();
              }
              nextLevel.push(path);
            });
          }
          if (config.vendor != undefined && config.vendor.length) {
            angular.forEach(config.vendor, function(filepath) {
              nextLevel.push(options.directory.vendors + '/' + filepath);
            });
          }
          if (config.external != undefined && config.external.length) {
            angular.forEach(config.external, function(filepath) {
              nextLevel.push(filepath);
            });
          }

          return nextLevel;
        },
        dependencies = angular.copy(options.modules);

        angular.forEach(modules.configs, function(config) {
          var moduleName = config.name.toLowerCase();
          if (dependencies.indexOf(moduleName) == -1) {
            var module = angular.module(moduleName, config.modules || []);
            if (config.config != undefined && config.config !== false) {
              module.config(config.config);
              appModules.push(module);
            }
            dependencies.push(moduleName);
          }
        });

        if (options.component != undefined && options.component.length) {
          angular.forEach(options.component, function(name) {
            var path;
            if (angular.isObject(name)) {
              path = options.directory.modules + '/' + name.module + '/' + options.directory.components + '/' + lib.toCamelCase(name.name) + '.js' + lib.getVersionPrefix();
            } else {
              path = options.directory.vendors + '/' + options.directory.components + '/' + lib.toCamelCase(name) + '.js' + lib.getVersionPrefix();
            }
            toLoad.push(path);
          });
        }
        if (options.directive != undefined && options.directive.length) {
          angular.forEach(options.directive, function(name) {
            var path;
            if (angular.isObject(name)) {
              path = options.directory.modules + '/' + name.module + '/' + options.directory.directives + '/' + lib.toCamelCase(name.name) + '.js' + lib.getVersionPrefix();
            } else {
              path = options.directory.vendors + '/' + options.directory.directives + '/' + lib.toCamelCase(name) + '.js' + lib.getVersionPrefix();
            }
            toLoad.push(path);
          });
        }
        if (options.service != undefined && options.service.length) {
          angular.forEach(options.service, function(name) {
            var path;
            if (angular.isObject(name)) {
              path = options.directory.modules + '/' + name.module + '/' + options.directory.services + '/' + lib.toCamelCase(name.name) + '.js' + lib.getVersionPrefix();
            } else {
              path = options.directory.vendors + '/' + options.directory.services + '/' + lib.toCamelCase(name) + '.js' + lib.getVersionPrefix();
            }
            toLoad.push(path);
          });
        }
        if (options.filter != undefined && options.filter.length) {
          angular.forEach(options.filter, function(name) {
            var path;
            if (angular.isObject(name)) {
              path = options.directory.modules + '/' + name.module + '/' + options.directory.filters + '/' + lib.toCamelCase(name.name) + '.js' + lib.getVersionPrefix();
            } else {
              path = options.directory.vendors + '/' + options.directory.filters + '/' + lib.toCamelCase(name) + '.js' + lib.getVersionPrefix();
            }
            toLoad.push(path);
          });
        }
        if (options.vendor != undefined && options.vendor.length) {
          angular.forEach(options.vendor, function(filepath) {
            toLoad.push(options.directory.vendors + '/' + filepath);
          });
        }
        if (options.external != undefined && options.external.length) {
          angular.forEach(options.external, function(filepath) {
            toLoad.push(filepath);
          });
        }
        
        appModule = angular.module(options.name, dependencies);
      
        appConfig = ['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
          var otherwiseSet = false,
          $rootElement = angular.element(document);
          angular.forEach(modules.configs, function(config) {
            moduleConfig = angular.merge(moduleConfig, config);
            if (config.state != undefined) {
              var moduleName = config.name.toLowerCase(),
              moduleDirectory = options.directory.modules + '/' + moduleName,
              loaded = [],
              toLoadModule = toLoadCopy(moduleDirectory, toLoad, config),
              toLoadConfigModule = toLoadConfig(options.lazy, config.lazy || {});

              if (config.state != undefined) {
                angular.forEach(config.state, function(stateParams, stateName) {
                  if (stateName == 'otherwise') {
                    if (!otherwiseSet) {
                      otherwiseSet = true;
                      $urlRouterProvider.otherwise(stateParams);
                    }
                    return;
                  }
                  var controllerName = lib.toCamelCase(stateParams.controller),
                  templateUrl = options.directory.modules + '/' + moduleName + '/' + options.directory.views + '/' + controllerName + '.html' + lib.getVersionPrefix();
                  
                  if (stateParams.layout) {
                    var tmpUrl = templateUrl;
                    templateUrl = function() {
                      if (this.layout != undefined) {
                        var templateName = $rootElement.injector().invoke(this.layout);
                        if (templateName != undefined && templateName != '') {
                          return this.options.directory.modules + '/' + this.moduleName + '/' + this.options.directory.views + '/' + this.controllerName + '/' + templateName + '.html' + lib.getVersionPrefix();
                        } else {
                          return this.templateUrl;
                        }
                      } else {
                        return this.templateUrl;
                      }
                    }.bind({
                      layout: stateParams.layout,
                      options: options,
                      moduleName: moduleName,
                      controllerName: controllerName,
                      templateUrl: tmpUrl
                    });
                  }
                  
                  var toLoadState = toLoadCopy(moduleDirectory, toLoadModule, stateParams),
                  toLoadConfigState = toLoadConfig(toLoadConfigModule, stateParams.lazy || {}),
                  newStateParams = {
                    url: stateParams.url,
                    abstract: stateParams['abstract'] === true,
                    onEnter: stateParams['onEnter'] || angular.noop,
                    onExit: stateParams['onExit'] || angular.noop,
                    controller: moduleName + '.' + controllerName,
                    templateUrl: templateUrl,
                    params: stateParams['params'] || {},
                    resolve: {
                      loadMyCtrl: ['$ocLazyLoad', function($ocLazyLoad) {
                        var toLoadResolve = angular.copy(toLoadState);
                        toLoadResolve.unshift(moduleDirectory + '/' + options.directory.controllers + '/' + controllerName + '.js' + lib.getVersionPrefix());
                        angular.forEach(toLoadResolve, function(item, index) {
                          var search = loaded.indexOf(item);
                          if (search > -1) {
                            toLoadResolve.splice(search, 1);
                          } else {
                            loaded.push(item);
                          }
                        });
                        return $ocLazyLoad.load(toLoadResolve, toLoadConfigState);
                      }]
                    }
                  };
                  
                  $stateProvider.state(stateName, newStateParams);
                });
              }
            }
          });

          if (!otherwiseSet) {
            $urlRouterProvider.otherwise('/');
          }
        }];
        appModule.provider('$lazy', [function() {
          var $provider = this;

          $provider.modules = function(nodes) {
            return appModules;
          };

          $provider.config = function(node) {
            return moduleConfig;
          };

          $provider.state = function(node) {
            return moduleConfig.state;
          };

          $provider.$get = [function() {
            return {
              modules: function() {
                return $provider.modules();
              },
              config: function() {
                return $provider.config();
              },
              state: function() {
                return $provider.state();
              }
            };
          }];
        }]);

        return $q.all(promises)
        .then(function () {
          $timeout(function() {
            appModule.config(appConfig);
            appModule.config(callbacks.config);
            appModule.run((callbacks.run || angular.noop));
            (callback || angular.noop)(appModule);
            lib.bootstrap(appModule);
          }, 0);
        }, callbacks.error)
        .finally(callbacks.done);
      }
    };
  };
})(angular);