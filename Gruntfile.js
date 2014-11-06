var grunt = require('grunt'),
    async = require('async'),
    fs = require('fs'),
    format = require('util').format,
    extend = require('util')._extend,
    pkg = require('./package.json'),
    deploy = {}, env,
    depMapper = function(s) { return pkg.deploy[env].user + '@' + s; };

grunt.loadNpmTasks('grunt-contrib-jshint');
grunt.loadNpmTasks('grunt-shipit');

for (var env in pkg.deploy) {
  deploy[env] = {servers: pkg.deploy[env].servers.map(depMapper)};
}

grunt.initConfig({
  shipit: extend({
    options: {
      workspace: '/tmp/skype-history-daemon',
      deployTo: '/var/skype/daemon',
      repositoryUrl: pkg.repository,
      ignores: ['.git', '.gitignore', 'README.md', 'node_modules', 'init.tmpl'],
      keepReleases: 5
    },
  }, deploy),
  jshint: {
    all: [
      'Gruntfile.js',
      'daemon.js'
    ]
  }
});

grunt.registerTask('post-fetch', function() {
  var done = this.async();
  fs.readFile('init.tmpl', {encoding: 'utf-8'}, function(err, template) {
    template = grunt.template.process(template, {data: { pkg: pkg }});
    fs.writeFile(grunt.shipit.config.workspace + '/init', template, {encoding: 'utf8'}, done);
  });
});

grunt.shipit.on('fetched', function() {
  grunt.task.run(['post-fetch']);
});

grunt.registerTask('post-update', function() {
  async.waterfall([
    grunt.shipit.remote.bind(grunt.shipit, format('cd %s && npm install && npm rebuild', grunt.shipit.releasePath)),
    grunt.shipit.remote.bind(grunt.shipit, format('sudo mv %s/init /etc/init/%s.conf', grunt.shipit.releasePath, pkg.name)),
  ], this.async());
});

grunt.shipit.on('updated', function () {
  grunt.task.run(['post-update']);
});

grunt.registerTask('post-publish', function() {
  grunt.shipit.remote(format('sudo restart %s || sudo start %s', pkg.name, pkg.name), this.async());
});

grunt.shipit.on('published', function() {
  grunt.task.run(['post-publish']);
});
