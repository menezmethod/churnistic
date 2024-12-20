module.exports = (path, options) => {
  // Call the default resolver
  return options.defaultResolver(path, {
    ...options,
    // Force all files to be treated as CommonJS
    packageFilter: (pkg) => {
      if (pkg.type === 'module') {
        delete pkg.type;
        pkg.main = pkg.main || 'index.js';
      }
      return pkg;
    },
  });
};
