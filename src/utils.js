export const createFragment = function (html, parentDomClass = []) {
    let fragmentDom = document.createDocumentFragment();
    let contentDom = document.createElement('span');
    for (let i = 0; i < parentDomClass.length; i++) {
        contentDom.classList.add(parentDomClass[i]);
    }

    contentDom.innerHTML = html;
    fragmentDom.appendChild(contentDom);
    return fragmentDom;
};