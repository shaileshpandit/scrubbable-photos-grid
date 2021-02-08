// app state - list of all sections and their image counts
var allSections = [];

// grid's config - should be updated on viewport resize
var config = {
  containerWidth: window.innerWidth,
  targetRowHeight: 150
};

loadUi();


// gets all sections using api, populates grid div
function loadUi() {
  getSections().then(sections => {
    allSections = sections;
    populateGrid(document.getElementById("grid"));
  });
}

// populates grid node with all detached sections
function populateGrid(gridNode) {
  const sectionsHtml = allSections.map(getDetachedSectionHtml).join("\n");
  gridNode.innerHTML = sectionsHtml;
}

// generates detached section html, detached section has estimated height and no segments loaded
function getDetachedSectionHtml(section) {
  return `<div id="${section.sectionId}" class="section" style="width: ${config.containerWidth}px; height: ${estimateSectionHeight(section)}px;"></div>`;
}

// estimates section height, taken from google photos blog
// Ideally we would use the average aspect ratio for the photoset, however assume
// a normal landscape aspect ratio of 3:2, then discount for the likelihood we
// will be scaling down and coalescing.
function estimateSectionHeight(section) {
  const unwrappedWidth = (3 / 2) * section.totalImages * config.targetRowHeight * (7 / 10);
  const rows = Math.ceil(unwrappedWidth / config.containerWidth);
  const height = rows * config.targetRowHeight;

  return height;
}