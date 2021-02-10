var justifiedLayout = require('justified-layout');

// app state - list of all sections and their state
var sectionStates = {};

// grid's config - should be updated on viewport resize
var config = {
  containerWidth: window.innerWidth,
  targetRowHeight: 150,
  segmentsMargin: 20,
  sectionMargin: 20
};

loadUi();


// gets all sections using api, populates grid div
function loadUi() {
  getSections().then(sections => {
    populateGrid(document.getElementById("grid"), sections);

    // simulating directly jumping to random scroll position
    window.scrollTo({ top: 10000 });
  });
}

// populates grid node with all detached sections
function populateGrid(gridNode, sections) {
  var sectionsHtml = "";
  var prevSectionEnd = config.sectionMargin;
  for (const section of sections) {
    sectionStates[section.sectionId] = {
      ...section,
      lastUpdateTime: -1,
      height: estimateSectionHeight(section),
      top: prevSectionEnd
    };

    sectionsHtml += getDetachedSectionHtml(sectionStates[section.sectionId]);
    prevSectionEnd += sectionStates[section.sectionId].height + config.sectionMargin;
  }
  gridNode.innerHTML = sectionsHtml;

  // observe each section for intersection with viewport
  gridNode.querySelectorAll(".section").forEach(sectionObserver.observe.bind(sectionObserver));
}

// generates detached section html, detached section has estimated height and no segments loaded
function getDetachedSectionHtml(sectionState) {
  return `<div id="${sectionState.sectionId}" class="section" style="width: ${config.containerWidth}px; height: ${sectionState.height}px; top: ${sectionState.top}px; left: 0px";"></div>`;
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
function populateSection(sectionDiv, segments) {
  let sectionId = sectionDiv.id;
  let segmentsHtml = "";
  let prevSegmentEnd = config.segmentsMargin;
  for (const segment of segments) {
    const segmentInfo = getSegmentHtmlAndHeight(segment, prevSegmentEnd)
    segmentsHtml += segmentInfo.html;
    prevSegmentEnd += segmentInfo.height + config.segmentsMargin;
  }

  // add segments to section and calculate new height
  sectionDiv.innerHTML = segmentsHtml;
  const newSectionHeight = prevSegmentEnd;
  const oldSectionHeight = sectionStates[sectionId].height

  // adjust all next section's top if height of this section was modified
  const heightDelta = newSectionHeight - oldSectionHeight;
  if (heightDelta == 0) { return }

  sectionStates[sectionId].height = newSectionHeight;
  sectionDiv.style.height = `${newSectionHeight}px`;

  Object.keys(sectionStates).forEach(sectionToAdjustId => {
    if (sectionToAdjustId >= sectionId) { return }

    sectionStates[sectionToAdjustId].top += heightDelta;
    const sectionToAdjustDiv = document.getElementById(sectionToAdjustId);
    sectionToAdjustDiv.style.top = `${sectionStates[sectionToAdjustId].top}px`;
  });

  // adjust scroll if user is scrolling upwords and we loaded some section above current scroll position
  if (window.scrollY > sectionStates[sectionId].top) {
    window.scrollBy(0, heightDelta);
  }
}

// generates Segment html and height
function getSegmentHtmlAndHeight(segment, top) {
  const sizes = segment.images.map(image => image.metadata);
  var geometry = justifiedLayout(sizes, config);

  // gets tiles for each box given by justified layout lib
  var tiles = geometry.boxes.map(getTileHtml).join("\n");

  return {
    html: `<div id="${segment.segmentId}" class="segment" style="width: ${config.containerWidth}px; height: ${geometry.containerHeight}px; top: ${top}px; left: 0px;">${tiles}</div>`,
    height: geometry.containerHeight
  };
}

// generates Tile html
function getTileHtml(box) {
  return `<div class="tile" style="width: ${box.width}px; height: ${box.height}px; left: ${box.left}px; top: ${box.top}px;"></div>`;
}

// detaches section by removing childs of section div and keeping same height
function detachSection(sectionDiv) {
  sectionDiv.innerHTML = "";
}

const sectionObserver = new IntersectionObserver(handleSectionIntersection, {
  rootMargin: "200px 0px"
});

// handle when there is change for section intersecting viewport
function handleSectionIntersection(entries, observer) {
  entries.forEach((entry) => {
    const sectionDiv = entry.target;
    sectionStates[sectionDiv.id].lastUpdateTime = entry.time;

    if (entry.isIntersecting) {
      getSegments(sectionDiv.id).then(segments => {
        window.requestAnimationFrame(() => {
          if (sectionStates[sectionDiv.id].lastUpdateTime === entry.time) {
            populateSection(sectionDiv, segments);
          }
        });
      });
    } else {
      window.requestAnimationFrame(() => {
        if (sectionStates[sectionDiv.id].lastUpdateTime === entry.time) {
          detachSection(sectionDiv, entry.time)
        }
      });
    }
  });
}