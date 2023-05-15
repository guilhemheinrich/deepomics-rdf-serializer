
module.exports = function(grunt) {
    grunt.initConfig({
        ts: {
            default : {
              tsconfig: './tsconfig.json'
            }
          },
        copy: {
            main : {
                files: [
                    // {expand: true, src: ['assets/**'], dest: 'out/'},
                    {expand: true, src: ['src/**/*.json'], dest: 'out/'},
                    {src: ['.env'], dest: 'out/.env'}

                ]
            }
        }
    });
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.registerTask("default", ["ts", "copy"]);
  };