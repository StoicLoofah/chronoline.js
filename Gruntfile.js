module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/* <%= pkg.name %>.js v<%= pkg.version %> <%= grunt.template.today("dd-mm-yyyy") %> \n * by <%= pkg.author %> for Zanbato, https://zanbato.com \n * MIT <%= pkg.license %> */\n'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['chronoline/<%= pkg.name %>.js']
        }
      }
    },
    cssmin: {
        target: {
            files: {
            'dist/chronoline.min.css': ['chronoline/chronoline.css']
            }
        }
    },
    qunit: {
      files: ['test/*.html']
    },
    /* todo - to many warnings, enable this later after jshint cleanup
    jshint: {
      files: ['Gruntfile.js', 'chronoline/*.js'],
      options: {
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    },*/
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'qunit']
    },
    copy: {
        main: {
            files: [
                { src: ['chronoline/chronoline.js'], dest: 'dist/chronoline.js'},
                { src: ['chronoline/chronoline.css'], dest: 'dist/chronoline.css'},
                { src: ['chronoline/sprites.png'], dest: 'dist/sprites.png'}
            ],
        },
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('test', [/*'jshint',*/ 'qunit']);

  grunt.registerTask('default', [/*'jshint',*/ 'qunit', 'copy', 'uglify', 'cssmin']);

};