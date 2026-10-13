module.exports = {
  multipass: true,
  plugins: [{ name: 'preset-default', params: { overrides: {
    cleanupIds: false, removeViewBox: false, removeTitle: false, removeDesc: false,
    mergePaths: false, collapseGroups: false, removeEmptyContainers: false, removeHiddenElems: false,
    removeUnknownsAndDefaults: { keepDataAttrs: true, keepAriaAttrs: true }, convertShapeToPath: false
  } } }],
};
