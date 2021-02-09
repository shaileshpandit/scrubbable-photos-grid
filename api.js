function delay(ms) {
  return function (x) {
    return new Promise(resolve => setTimeout(() => resolve(x), ms));
  };
}

let sectionStore = fetch("/store.json").then(res => res.json());

// get all sections in users photo library - e.g. one section per month
function getSections() {
  return sectionStore.then(delay(50 + Math.random() * 500)).then(store => {
    return store.map(section => {
      return { sectionId: section.sectionId, totalImages: section.totalImages };
    });
  });
}

// get all segments inside one section - e.g. one segment per day
function getSegments(sectionId) {
  return sectionStore.then(delay(50 + Math.random() * 500)).then(store => {
    return store.find(section => section.sectionId == sectionId).segments
  });
}