# @matthewcpp/webgl

This is a simple to use framework for creating small graphics demos using WebGL2.

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
2. Next build the example that you are working on (see above)
3. Start the development server:
   ```shell
   npm run server
   ```
4. Access the example: at http://localhost:8080/examples/<ExampleName>
