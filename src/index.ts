import { interval, throwError, Subscription, fromEvent } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { map, switchMap, catchError, takeWhile, take } from 'rxjs/operators';
import './scss/main.scss';
import './favico.png';

import * as numeral from 'numeral';

import template from './templates/index.pug';
import { getApiRoot, createFragment, renderRank, emptyData } from './utils';

interface AnchorData {
    headimg: string;
    nickname: string;
    pfid: number;
    score: number;
    flag: number;
    flagIcon: string;
}

interface BonusData {
    time: number;
    pfid: number;
    msg: string;
}

interface ResBase {
    ret_code: string;
    ret_msg: string;
}

interface ActInfo {
    count_down: number;
    status: number;
}

interface StatusRes extends ResBase {
    data: ActInfo
}

interface ResObject extends ResBase {
    data: {
        act_info: ActInfo;
        list: AnchorData[];
    }
}

interface ResBonus extends ResBase {
    data: BonusData[];
}

declare global {
    interface Window { interval: any; switchMap: any;}
}

var url = new URL(location.href);

(function() {
    const apiRoot = getApiRoot();

    let actInfo = {
        status: 0,
        count_down: 0
    } as ActInfo;

    let rankSubscriber$: Subscription;
    let bonusSubscriber$: Subscription;
    let countdownSubscriber$: Subscription;

    const STATUS_TITLE = [
        '活動尚未開始',
        '活動即將開始',
        '距離活動結束還有',
        '活動已結束'
    ];
    const STATUS_TEXT = [
        '--',
        '--',
        '',
        '--'
    ];

    const FLAG = [
        'arrow-even',
        'arrow-down',
        'arrow-up'
    ];

    const bonusAjax$ = ajax.getJSON(apiRoot + '/v2/activity/etmall/bonus_news'); 
    const activityAjax$ = ajax.getJSON(apiRoot + '/v2/activity/etmall/list'); 
    const statusAjax$ = ajax.getJSON(apiRoot + '/v2/activity/etmall/act'); 

    let rankData: AnchorData[] = new Array(20).fill(emptyData);
    const top3 = rankData.slice(0, 3);

    // first append template
    let rootDom = document.getElementById('root');
    rootDom.appendChild(createFragment(
        template({
            top3,
            html: new Array(7).fill('')
        }),
        ['align-center']
    ));

    let animateDom = document.getElementById('animate-block');
    const targetDom = document.getElementById('buy-scroll-blk');

    const updateStatus = () => {
        let statusText;
        const { status, count_down } = actInfo;
        if (status !== 2) {
            statusText = STATUS_TEXT[status];
        } else {
            let h = Math.floor(count_down / 3600);
            let m = Math.floor(count_down / 60) % 60;
            statusText = `${numeral(h).format('00')}:${numeral(m).format('00')}:${numeral(count_down % 60).format('00')}`
        }

        document.getElementById('countTitle').innerHTML = STATUS_TITLE[status];
        document.getElementById('countdown').innerHTML = statusText;
    };

    const renderBonusCbk = (res: ResBonus) => {
        if (res.ret_code === '0') {
            let fragment = document.createDocumentFragment();
            res.data.forEach((elem: BonusData) => {
                const divDom = document.createElement('div');
                divDom.innerHTML = elem.msg;
                fragment.appendChild(divDom);
            });
            targetDom.innerHTML = '';
            targetDom.appendChild(fragment);
            document.getElementsByClassName('note-board')[0].innerHTML = res.data.length ? res.data[0].msg : '';
        }
    }

    const bonusInterval$ = interval(30000).pipe(
        switchMap(() => bonusAjax$),
        catchError((err: any) => throwError(err))
    );

    const renderRankCbk = (res: ResObject) => {
        if (res.ret_code === '0') {
            rankData = res.data.list;
            rankData.forEach(data => {
                data.flagIcon = FLAG[data.flag];
            });
            renderRank(animateDom, rankData);
            if (res.data.act_info.status > 2) {
                stopSubscriber();
                // fetch bonus data last time
                bonusAjax$.subscribe((res: ResBonus) => {
                    renderBonusCbk(res);
                });

                if (Math.abs(actInfo.count_down - res.data.act_info.count_down) > 3) {
                    actInfo.count_down = res.data.act_info.count_down;
                }
                actInfo.status = res.data.act_info.status;
                updateStatus();
            }
        }
    };

    const fetchInterval$ = interval(10000).pipe(
        switchMap(() => activityAjax$),
        catchError((err: any) => throwError(err))
    )

    const startSubscriber = () => {
        // first fetch board data
        bonusAjax$.subscribe((res: ResBonus) => {
            renderBonusCbk(res);
            bonusSubscriber$ = bonusInterval$.subscribe(renderBonusCbk); // re fetch board data per 30 secs
        }); 
        
        // first fetch rank data
        activityAjax$.subscribe((res: ResObject) => {
            renderRankCbk(res);
            rankSubscriber$ = fetchInterval$.subscribe(renderRankCbk); // re fetch board data per 5 secs 
        });

        countdownSubscriber$ = 
            interval(1000).pipe(takeWhile(() => {
                return actInfo.count_down > 0
            }))
            .subscribe(() => {
                actInfo.count_down--;
                updateStatus();
            });
    }

    const stopSubscriber = () => {
        rankSubscriber$ && rankSubscriber$.unsubscribe();
        bonusSubscriber$ && bonusSubscriber$.unsubscribe();
        countdownSubscriber$ && countdownSubscriber$.unsubscribe();
    };

    const start$ = interval(3000).pipe(
        switchMap(() => statusAjax$),
        takeWhile((res: StatusRes) => {
            const isStart = res.data.status === 2;
            actInfo = res.data;
            if (isStart) {
                startSubscriber();
            }
            updateStatus();
            return !isStart;
        })
    );

    let count = 10;
    const preloadDom = document.getElementById('preload-content');
    const countDown$ = interval(1000).pipe(
        map(() => count--),
        takeWhile(() => count >= 0)
    );

    if (url.searchParams.get('skip')) {
        document.getElementsByClassName('preload')[0].remove();
        start$.subscribe();
    } else {
        fromEvent(document.getElementById('button'), 'click').pipe(take(1))
            .subscribe((e: Event) => {
                (<HTMLElement>e.target).remove();
                countDown$.subscribe(() => { 
                    const dom = document.createElement('div');
                    dom.classList.add('content', 'animate');
                    dom.innerHTML = count.toString();
                    preloadDom.replaceChild(dom, preloadDom.childNodes[1]);
                    if (count === 5) {
                        start$.subscribe();
                    }

                    if (count <= 0) {
                        document.getElementsByClassName('preload')[0].remove();
                    }
                });
            }
        );
    }
    
})();