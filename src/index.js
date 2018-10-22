import { interval } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { map, catchError } from 'rxjs/operators';
import './scss/main.scss';
import './favico.png';

import MockData from './mockData.json';
import numeral from 'numeral';

import template from './templates/index.pug';
import rankDetail from './templates/rank-detail.pug';
import rankTemplate from './templates/rank-template.pug';
import { createFragment } from './utils';

(function() {
    MockData.data.forEach(data => {
        data.number = numeral(data.number).format('0,0');
    })
    const top3 = MockData.data.slice(0, 3);

    // first append template
    let rootDom = document.getElementById('root');
    rootDom.appendChild(createFragment(
        template({
            top3,
            html: []
        }),
        ['align-center']
    ));

    let animateDom = document.getElementById('animate-block');

    const renderRank = function () {
        let html = new Array(7).fill('');
        for (let i = 0; i < 14; i++) {
            html[(i % 7)] += rankDetail({ rank: i + 4 });
        }

        animateDom.innerHTML = '';
        animateDom.appendChild(
            createFragment(rankTemplate({
                top3,
                html
            }))
        );
        animateDom.classList.remove('animate');
        setTimeout(() => {
            animateDom.classList.add('animate');
        }, 0);
    }

    interval(5000).subscribe(() => renderRank());

    var texts = ['獲得了一件商品', '獲得24999件商品，出手闊綽', '獲得72件商品，太厲害了'];
    const randomInterval$ = interval(2000);
    const targetDom = document.getElementById('buy-scroll-blk');
    randomInterval$.subscribe(() => {
        const dom = document.createElement('div');
        dom.innerHTML = 'XXX : ' + texts[Math.floor(Math.random() * 10 % 3)];
        const msgLen = targetDom.childNodes.length;
        targetDom.prepend(dom);
        if (msgLen > 100) {
            targetDom.childNodes[msgLen - 1].remove();
        }
        
    });

    // const obs$ = ajax.getJSON(`https://data-api.kingkong.com.tw/pubg/v1/alive?pfids=1026996,1030033`).pipe(
    //     map(userResponse => console.log('users: ', userResponse)),
    //     catchError(error => console.log('error: ', error))
    // );
    // obs$.subscribe(() => {});
})();