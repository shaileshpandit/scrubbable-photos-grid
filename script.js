var justifiedLayout = require('justified-layout');

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

  // populate each section eagerly
  gridNode.querySelectorAll(".section").forEach(populateSection);
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

// populates section with actual segments html
function populateSection(sectionDiv) {
  getSegments(sectionDiv.id).then(segments => {
    // adds all segments as childs of section
    sectionDiv.innerHTML = segments.map(getSegmentHtml).join("\n");
    sectionDiv.style.height = "100%"
  });
}

// generates Segment html
function getSegmentHtml(segment) {
  const sizes = segment.images.map(image => image.metadata);
  var geometry = justifiedLayout(sizes, config);

  // gets tiles for each box given by justified layout lib
  var tiles = geometry.boxes.map(getTileHtml).join("\n");

  return `<div id="${segment.segmentId}" class="segment" style="width: ${config.containerWidth}px; height: ${geometry.containerHeight}px;">${tiles}</div>`;
}

// generates Tile html
function getTileHtml(box) {
  return `<div class="tile" style="width: ${box.width}px; height: ${box.height}px; left: ${box.left}px; top: ${box.top}px;"></div>`;
}