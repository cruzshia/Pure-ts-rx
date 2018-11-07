import rankDetail from './templates/rank-detail.pug';
import rankTemplate from './templates/rank-template.pug';

export const emptyData = {
    nickname: '--',
    pfid: 0,
    score: 0,
    flagIcon: ''
};

export const createFragment = function (html: string, parentDomClass:(string[]) = []) {
    let fragmentDom = document.createDocumentFragment();
    let contentDom = document.createElement('span');
    for (let i = 0; i < parentDomClass.length; i++) {
        contentDom.classList.add(parentDomClass[i]);
    }

    contentDom.innerHTML = html;
    fragmentDom.appendChild(contentDom);
    return fragmentDom;
};

export const rankHtml = function (rankData: Array<any>) {
    let html = new Array(7).fill('');
    for (let i = 3; i < 17; i++) {
        const row = Math.floor((i - 3) / 2);
        html[row] += rankDetail({ 
            ...(rankData[i] || emptyData),
            rank: i + 1
        });
    }
    return html;
}

export const renderRank = function (animateDom: HTMLElement, rankData: Array<any> = []) {
    animateDom.innerHTML = '';
    let top3 = rankData.slice(0, 3);
    for (let i = 0; i < 3; i++) {
        top3[i] = top3[i] || emptyData;
    }
    animateDom.appendChild(
        createFragment(rankTemplate({
            top3,
            html: rankHtml(rankData)
        }))
    );
    animateDom.classList.remove('animate');
    setTimeout(() => {
        animateDom.classList.add('animate');
    }, 0);
}

export const getApiRoot = function () {
    return '/api';
}