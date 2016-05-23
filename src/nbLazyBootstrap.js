/* global angular */

/**
 * Bootstrapping angular project with lazy loading support
 * 
 * @param {Object} angular
 * @returns {void}
 */
(function(angular) {
  'use strict';
  
  if (angular.nbLazyBootstrap == undefined) {
    angular.nbLazyBootstrap = {};
    angular.nbLazyBootstrap.modules = [];
    angular.nbLazyBootstrap.module = {};
    angular.nbLazyBootstrap.options = {};
  }

  angular.nbLazyBootstrap.module = function(name, config) {
    if (config != undefined) {
      angular.nbLazyBootstrap.modules.push(angular.extend(config, {name: name.toLowerCase()}));
      return null;
    } else {
      return angular.module(name.toLowerCase());
    }
  };

  angular.nbLazyBootstrap.root = function() {
    return angular.module(angular.nbLazyBootstrap.run('name'));
  };

  angular.nbLazyBootstrap.run = function(opt) {

    if (opt != undefined && typeof opt == 'string') {
      switch (opt) {
        case 'name': return angular.nbLazyBootstrap.options.name;
        default: throw 'Unkwnown nbLazyBootstrap command';
      }
    }

    var options = angular.extend({
      name: 'app',
      requires: [],
      vendor: [],
      external: [],
      config: false,
      complete: false,
      lazy: {
        cache: true,
        timeout: 60000,
        reconfig: false,
        rerun: false,
        serie: false,
        insertBefore: undefined
      },
      directories: {
        modules: 'module',
        controllers: 'controller',
        directives: 'directive',
        services: 'service',
        filters: 'filter',
        views: 'view',
        vendors: 'vendor'
      }
    }, opt),
    run = function() {

      options.requires.unshift('oc.lazyLoad');

      angular.nbLazyBootstrap.options = options;

      var appModule, 
      appModules = [],
      toLoad = [],
      toLoadConfig = function(baseConfig, config) {
        return angular.merge(angular.copy(baseConfig), config);
      },
      toLoadCopy = function(moduleDirectory, toLoad, config) {
        var nextLevel = angular.copy(toLoad);
        
        if (config.directive != undefined && config.directive.length) {
          angular.forEach(config.directive, function(name) {
            nextLevel.push(moduleDirectory + options.directories.directives + '/' + name + '.js');
          });
        }
        if (config.service != undefined && config.service.length) {
          angular.forEach(config.service, function(name) {
            nextLevel.push(moduleDirectory + options.directories.services + '/' + name + '.js');
          });
        }
        if (config.filter != undefined && config.filter.length) {
          angular.forEach(config.filter, function(name) {
            nextLevel.push(moduleDirectory + options.directories.filters + '/' + name + '.js');
          });
        }
        if (config.vendor != undefined && config.vendor.length) {
          angular.forEach(config.vendor, function(filepath) {
            nextLevel.push(options.directories.vendors + '/' + filepath);
          });
        }
        if (config.external != undefined && config.external.length) {
          angular.forEach(config.external, function(filepath) {
            nextLevel.push(filepath);
          });
        }
        
        return nextLevel;
      },
      requires = angular.copy(options.requires);
      
      if (requires.indexOf('ionic') == -1) {
        requires.push('ionic');
      }

      angular.forEach(angular.nbLazyBootstrap.modules, function(config) {
        var moduleName = config.name.toLowerCase();
        if (requires.indexOf(moduleName) == -1) {
          var module = angular.module(moduleName, config.requires || []);
          if (config.config != undefined && config.config !== false) {
            module.config(config.config);
          }
          appModules.push(module);
          requires.push(moduleName);
        }
      });

      if (options.vendor != undefined && options.vendor.length) {
        angular.forEach(options.vendor, function(filepath) {
          toLoad.push(options.directories.vendors + '/' + filepath);
        });
      }
      if (options.external != undefined && options.external.length) {
        angular.forEach(options.external, function(filepath) {
          toLoad.push(filepath);
        });
      }

      appModule = angular.module(options.name, requires);
      appModule.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
        var otherwiseSet = false;
        angular.forEach(angular.nbLazyBootstrap.modules, function(config) {
          if (config.navigation != undefined) {
            var moduleName = config.name.toLowerCase(),
            moduleDirectory = options.directories.modules + '/' + moduleName + '/',
            toLoadModule = toLoadCopy(moduleDirectory, toLoad, config),
            toLoadConfigModule = toLoadConfig(options.lazy, config.lazy || {});
            
            if (config.navigation.states != undefined) {
              angular.forEach(config.navigation.states, function(stateParams, stateName) {
                var controllerName = stateParams.controller.toLowerCase(),
                toLoadState = toLoadCopy(moduleDirectory, toLoadModule, stateParams),
                toLoadConfigState = toLoadConfig(toLoadConfigModule, stateParams.lazy || {}),
                newStateParams = {
                  url: stateParams.url,
                  controller: moduleName + '.' + controllerName,
                  templateUrl: options.directories.modules + '/' + moduleName + '/' + options.directories.views + '/' + controllerName + '.html',
                  resolve: {
                    loadMyCtrl: ['$ocLazyLoad', function($ocLazyLoad) {
                      var toLoad = angular.copy(toLoadState);
                      toLoad.unshift(moduleDirectory + options.directories.controllers + '/' + controllerName + '.js');
                      return $ocLazyLoad.load(toLoad, toLoadConfigState);
                    }]
                  }
                };
                $stateProvider.state(stateName, newStateParams);
              });
            }
            if (!otherwiseSet) {
              otherwiseSet = true;
              if (config.navigation.otherwise != undefined) {
                $urlRouterProvider.otherwise(config.navigation.otherwise);
              }
            }
          }
        });

        if (!otherwiseSet) {
          $urlRouterProvider.otherwise('/');
        }
      }]);

      if (options.config != undefined && options.config !== false) {
        appModule.config(options.config);
      }
      
      if (typeof options.complete == 'function') {
        options.complete.call(options, appModule, appModules);
      }
      
      return appModule;
    };

    return run();
  };
})(angular);