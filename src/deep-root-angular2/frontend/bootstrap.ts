let deepKernel = DeepFramework.Kernel;

interface Config {
  map: {},
  packages: {},
  defaultJSExtensions?: string
}

class BootstrapHelper {
  _deepKernel: any = DeepFramework.Kernel;
  _deepAsset: any = this._deepKernel.get('asset');

  /**
   * @param {String[]} links
   * @returns {Promise}
   */
  getBootstrapScripts(links) {
    let promises : Array<any> = [];
    let allProviders : Array<any> = [];
    let promise : any;

    for (let script of links) {
      promise = System.import(script)
        .then((modules) => {
          let finalProviders : Array<any> = [];

          for (let index in modules) {
            if (!modules.hasOwnProperty(index)) {
              continue;
            }

            finalProviders.push(modules[index]);
          }

          allProviders = allProviders.concat(finalProviders);
        });

      promises.push(promise);
    }

    return Promise.all(promises).then(() => {
      return allProviders;
    });
  }

  /**
   * @returns {Promise}
   */
  getSystemConfigs() {
    let promises : Array<any> = [];
    let promise : any;
    let links : any = this._getConfigLinks;
    let finalConfig : Config = {
      map: {},
      packages: {},
      defaultJSExtensions: this._defaultJSExtensions,
    };

    for (let index in links) {
      if (!links.hasOwnProperty(index)) {
        continue;
      }

      promise = this._getConfig(index, links[index]).then((config : Config) => {

        Object.assign(finalConfig.map, config.map);
        Object.assign(finalConfig.packages, config.packages);
      });

      promises.push(promise);
    }

    return Promise.all(promises).then(() => {
      return finalConfig;
    });
  }

  /**
   * @param {String} microservice
   * @param {String} configPath
   * @returns {Promise}
   * @private
   */
  _getConfig(microservice, configPath) {
    return System.import(configPath).then((exportData) => {
      let config : Config = exportData.config;

      for (let index in config.map) {
        if (!config.map.hasOwnProperty(index)) {
          continue;
        }
        
        config.map[index] = this._deepAsset.locate(`@${microservice}:${config.map[index]}`, '', true);
      }

      return config;
    });
  }

  /**
   * @returns {String[]}
   * @private
   */
  get _getConfigLinks() {
    let links : any = {};
    let microservices : Array<string> = Object.keys(DeepFramework.Kernel.config.microservices);

    for (let microservice of microservices) {
      links[microservice] = this._deepAsset.locate(`@${microservice}:js/systemjs.config.js`);
    }

    return links;
  }

  /**
   * @returns {String}
   * @params
   */
  get _defaultJSExtensions() {
    return 'js';
  }
}

deepKernel.bootstrap(() => {
  let bootstrapScripts : Array<string> = deepKernel.get('deep_frontend_bootstrap_vector');
  let bootstrapHelper : BootstrapHelper = new BootstrapHelper();

  bootstrapHelper.getSystemConfigs().then((config) => {

    System.config(config);

    bootstrapHelper.getBootstrapScripts(bootstrapScripts).then((allProviders) => {
      DeepFramework.angularDependencies = allProviders;

      System.import('js/app/app.module.js').then((module) => {
        System.import('@angular/platform-browser-dynamic').then((content) => {
          content.platformBrowserDynamic().bootstrapModule(module.RootAngularModule);
        });
      });
    });
  });
});