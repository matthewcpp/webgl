# @matthewcpp/webgl

This is a simple to use framework for creating small graphics demos using WebGL2.

### Getting Started

The [@matthewcpp/webgl-samples](https://github.com/matthewcpp/webgl-examples) repo contains detailed example scenes showcasing the framework's features.

### Building the Core Framework
The framework is built using rollup.  [gl-matrix](https://github.com/toji/gl-matrix) is configured as an external dependency. 
To build the distribution bundle run the following command:
```shell
npm run build-core
```
This will produce an es6 module and accompanying typescript definition file in the `dist` directory.

### Building Examples

This package includes some basic samples exercising the framework capabilities.  They can be build indovidual by using the command below.
```shell
npm run build-example <example-name>
```

### Running / Testing

1. Begin by installing the Javascript dependencies into the dist folder:
    ```shell
    npm run init-deps
    ```
1. Next build the example that you are working on (see above)
1. Start the development server:
   ```shell
   npm run server
   ```
