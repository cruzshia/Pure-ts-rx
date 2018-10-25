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
        html[((i - 3) % 7)] += rankDetail({ 
            ...(rankData[i] || emptyData),
            rank: i + 1
        });
    }
    return html;
}

export const renderRank = function (animateDom: HTMLElement, rankData: Array<any>) {
    animateDom.innerHTML = '';
    animateDom.appendChild(
        createFragment(rankTemplate({
            top3: rankData.slice(0, 3),
            html: rankHtml(rankData)
        }))
    );
    animateDom.classList.remove('animate');
    setTimeout(() => {
        animateDom.classList.add('animate');
    }, 0);
}

export const getApiRoot = function () {
    let path = '/api';
    if (location.href.indexOf('pc-test') > 0) {
        path = 'https://api.s.lang.live';
    } else if (location.href.indexOf('kingkong.com.tw') > 0) {
        path = 'https://tw.api.langlive.com';   
    }
    return path;
}