import { interval, throwError, Subscription } from 'rxjs';
import { ajax, AjaxResponse } from 'rxjs/ajax';
import { map, switchMap, catchError, takeWhile } from 'rxjs/operators';
import './scss/main.scss';
import './favico.png';
import './images/cargo.gif';

import * as numeral from 'numeral';
import { Record } from 'immutable'

import template from './templates/index.pug';
import { getApiRoot, createFragment, renderRank, rankHtml, emptyData } from './utils';

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

interface ComsumeData {
    msg: string;
    time: number;
}

interface ResConsume extends ResBase {
    data: {
        flag: number;
        list: ComsumeData[];
    }
}

declare global {
    interface Window { interval: any; switchMap: any;}
}

(function() {
		const apiRoot = getApiRoot();

    let actInfo = {
        status: 0,
        count_down: 0
		} as ActInfo;
		
    let preloadSubscriber$: Subscription;

    let rankSubscriber$: Subscription;
    let bonusSubscriber$: Subscription;
    let consumeSubscriber$: Subscription;
    let countdownSubscriber$: Subscription;
    let startSubscriber$: Subscription;

    const STATUS_TITLE = [
        '活動預計於10月8日18:45開始',
        '距離活動開始還有',
        '距離活動結束還有',
        '活動已結束，正在結算中'
    ];
    const STATUS_TEXT = [
        '--',
        '&nbsp;',
        '&nbsp;',
        '&nbsp;'
    ];

    const FLAG = [
        'arrow-even',
        'arrow-down',
        'arrow-up'
    ];

    let startFlag = 0;
		let consumeList: ComsumeData[] = [];
		
    const bonusAjax$ = ajax.getJSON(apiRoot + '/v2/activity/etmall/bonus_news'); 
    const rankAjax$ = ajax.getJSON(apiRoot + '/v2/activity/etmall/list'); 
    const statusAjax$ = ajax.getJSON(apiRoot + '/v2/activity/etmall/act'); 
    const consumeAjax = function () {
        var data;
        data = new FormData();
        data.append('flag', startFlag.toString());
        return ajax({
            url: apiRoot + '/v2/activity/etmall/consume_list',
            method: 'POST',
            body: data
        });
    }

    let rankData: AnchorData[] = new Array(20).fill(emptyData);
    const top3 = rankData.slice(0, 3);

    // first append template
    let rootDom = document.getElementById('root');
    rootDom.appendChild(createFragment(
        template({
            top3,
            html: rankHtml(new Array(7).fill(''))
        }),
        ['align-center']
    ));

    let animateDom = document.getElementById('animate-block');
    const targetDom = document.getElementById('buy-scroll-blk');
    const updateStatus = () => {
        let statusText;
        const { status, count_down } = actInfo;
        statusText = STATUS_TEXT[status];

        if (status === 1 && !startSubscriber$ && count_down <= 10) {
            document.getElementsByClassName('preload')[0].classList.remove('hide');
            startSubscriber$ = countDown$.subscribe(animate);
        }

        if (count_down > 0) {
            let h = Math.floor(count_down / 3600);
            let m = Math.floor(count_down / 60) % 60;
            statusText = `${numeral(h).format('00')}:${numeral(m).format('00')}:${numeral(count_down % 60).format('00')}`
        }

        document.getElementById('countTitle').innerHTML = STATUS_TITLE[status];
        document.getElementById('countdown').innerHTML = statusText || '&nbsp;';
    };

    /** ========== countdown interval =========== */
    let count = 10;
    const preloadDom = document.getElementById('preload-content');
    const countDown$ = interval(1000).pipe(
        map(() => count--),
        takeWhile(() => count >= 0)
    );


    /** ========== fetch bonus title interval =========== */
    const renderBonusCbk = (res: ResBonus) => {
        if (res.ret_code === '0') {
            const hasData = res.data.length > 0;
            let newDom = document.createElement(hasData ? 'marquee' : 'div');
            newDom.innerHTML = hasData ? res.data[0].msg : '';
            // document.getElementsByClassName('note-board')[0].innerHTML = res.data.length ? res.data[0].msg : '';
            const parentDom = document.getElementsByClassName('note-board')[0];
            parentDom.replaceChild(newDom, parentDom.firstElementChild);
        }
    }

    const bonusInterval$ = interval(30000).pipe(
        switchMap(() => bonusAjax$),
        catchError((err: any) => throwError(err))
    );


    /** ========== fetch ranking interval =========== */
    const renderRankCbk = (res: ResObject) => {
        if (res.ret_code === '0') {
            rankData = res.data.list || [];
            rankData.forEach(data => {
                data.flagIcon = data.flag >= 0 ? FLAG[data.flag] : '';
            });
            renderRank(animateDom, rankData);
            if (res.data.act_info.status > 2) {
                stopSubscriber();
                // fetch bonus data last time
                bonusAjax$.subscribe((res: ResBonus) => {
                    renderBonusCbk(res);
                });

                actInfo.status = res.data.act_info.status;
                updateStatus();
                document.getElementById('countdown').innerHTML = '&nbsp;';
            }
        }
    };

    const fetchInterval$ = interval(10000).pipe(
        switchMap(() => rankAjax$),
        catchError((err: any) => throwError(err))
    )

    /** ========== fetch comsume interval =========== */
    const consumeInterval$ = interval(3000).pipe(
        switchMap(() => consumeAjax()),
        catchError((err: any) => throwError(err))
    )

    const renderConSumeCbk = (res: ResConsume) => {
        if (res.ret_code === '0') {
            startFlag = res.data.flag; 
            consumeList = res.data.list.length ? res.data.list : [];
            consumeList.forEach((elem: ComsumeData) => { 
                const divDom = document.createElement('div');
                divDom.innerHTML = elem.msg;
                divDom.classList.add('scale-out');
                if (targetDom.childNodes.length) {
                    targetDom.insertBefore(divDom, targetDom.firstChild);
                } else {
                    targetDom.appendChild(divDom);
                }
                setTimeout(() => {
                    divDom.style.transform = 'scaleY(1)';
                }, 200);
                
            });
            while (targetDom.childNodes.length > 100) {
                targetDom.removeChild(targetDom.lastChild);
            }
        }
    }

    const consumeResCbk = (res: AjaxResponse) => {
        const response = res.response;
        if (response.ret_code === '0') {
            startFlag = res.response.flag;
            renderConSumeCbk(res.response); 
        }
    };


    /** ========== subscriber ready for listen =========== */
    const startSubscriber = (isEnd: boolean = false) => {
        document.getElementsByClassName('animate-blk')[0].classList.remove('x-vh');
        // first fetch board data
        bonusAjax$.subscribe((res: ResBonus) => {
            renderBonusCbk(res);
            let bonusErrorCount = 0;
            if (!isEnd) {
                // re fetch board data per 40 secs
                bonusSubscriber$ = bonusInterval$.subscribe(
                    renderBonusCbk,
                    () => {
                        bonusErrorCount++;
                        if (bonusErrorCount > 5) {
                            bonusSubscriber$.unsubscribe();
                        }
                    }
                );
            }
        }); 

        // first fetch rank data
        rankAjax$.subscribe((res: ResObject) => {
            renderRankCbk(res);
            let rankErrorCount = 0;
            if (!isEnd) {
                // re fetch board data per 10 secs
                rankSubscriber$ = fetchInterval$.subscribe(
                    renderRankCbk,
                    () => {
                        rankErrorCount++;
                        if (rankErrorCount > 5) {
                            rankSubscriber$.unsubscribe();
                        }
                    }
                );  
            }
        });

        // register fetch consume data
        consumeSubscriber$ = consumeInterval$.subscribe(consumeResCbk);

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
        consumeSubscriber$ && consumeSubscriber$.unsubscribe();
        countdownSubscriber$ && countdownSubscriber$.unsubscribe();
    };

    /** ========== status checking interval =========== */
    const startCbk = (res: StatusRes) => {
        const { status } = res.data;
        const isStart = status >= 2;
        const isStatusChange = actInfo.status !== status;
        actInfo = res.data;

        if (status === 1 && !preloadSubscriber$) {
            preloadSubscriber$ = interval(1000).pipe(takeWhile(() => {
                return actInfo.count_down > 0
            })).subscribe(() => {
                actInfo.count_down--;
                updateStatus();
            });
        }
        if (isStart) {
            preloadSubscriber$ && preloadSubscriber$.unsubscribe();
            startSubscriber();
        }

        if (isStatusChange) {
            updateStatus();
        }
        return status < 2;
    };

    const start$ = interval(3000).pipe(
        switchMap(() => statusAjax$),
        takeWhile(startCbk)
    );

    statusAjax$.subscribe((res: StatusRes) => {
        startCbk(res);
        if (res.data.status < 2) {
            start$.subscribe();
        }
    })


    const animate = () => { 
        const dom = document.createElement('div');
        dom.classList.add('content', 'animate');
        dom.innerHTML = count.toString();
        preloadDom.replaceChild(dom, preloadDom.childNodes[1]);

        if (count <= 0) {
            document.getElementsByClassName('preload')[0].remove();
        }
    };
})();