import Mock from 'mockjs';
import { ActivityConfig } from './config';

const configList: ActivityConfig[] = [
    {
        id: '1',
        name: 'TTest',
        zhName: '测试模板',
        config: {
            title: '标题',
            animation: '',
            backgroundColor: '#FFE1A0',
            backgroundImage: 'https://static.cdn.24haowan.com/jsfm/461394302Banner.png',
            themeColor: ''
        },
        pages: [
            {
                id: 'page-start',
                name: 'start',
                zhName: '活动开始页',
                config: {
                    title: '活动开始页',
                    animation: '',
                    backgroundColor: '#FFE1A0',
                    backgroundImage: 'https://static.cdn.24haowan.com/jsfm/461394302Banner.png'
                },
                plugins: [
                    {
                        id: 'plugin-1',
                        name: 'VButton',
                        zhName: '下一页按钮',
                        deletable: false,
                        margin: {
                            left: 0,
                            right: 0,
                            top: 10,
                            bottom: 0
                        },
                        config: {
                            text: '下一页',
                            backgroundColor: '#ffffff',
                            action: 'toPage',
                            data: 'game'
                        }
                    }
                ],
                pendants: [
                    {
                        id: 'plugin-2',
                        name: 'VButton',
                        zhName: '按钮',
                        deletable: false,
                        margin: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0
                        },
                        config: {
                            text: '不可拖动',
                            backgroundColor: '#ffffff',
                            action: 'toPage',
                            data: 'game'
                        },
                        mode: 'fixed',
                        wMode: 'fixed',
                        show: true,
                        pos: 1,
                        alignH: 'left',
                        alignV: 'top',
                        showInScreen: [0],
                        position: {left: 0, top: '20vw', right: 0, bottom: 0},
                    },
                    {
                        id: 'plugin-3',
                        name: 'VButton',
                        zhName: '按钮',
                        deletable: false,
                        margin: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0
                        },
                        config: {
                            text: '可选择位置',
                            backgroundColor: '#ffffff',
                            action: 'toPage',
                            data: 'game'
                        },
                        mode: 'fixed',
                        wMode: 'changePos',
                        show: true,
                        pos: 1,
                        alignH: 'left',
                        alignV: 'bottom',
                        showInScreen: [0],
                        position: {left: 0, top: 0, right: 0, bottom: 0},
                    }
                ],
                deletable: false
            },
            {
                id: 'page-game',
                name: 'game',
                zhName: '活动主页',
                config: {
                    animation: 'slide',
                    title: '活动主页',
                    backgroundColor: '#FFE1A0',
                    backgroundImage: 'http://cdn.via.cool/web/file/Banner@2x.png'
                },
                plugins: [
                    {
                        id: 'plugin-1',
                        name: 'VImage',
                        zhName: '图片',
                        deletable: false,
                        margin: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0
                        },
                        config: {
                            url: 'http://bearfile.codebear.cn/avatar.png',
                            width: 100,
                            height: 80
                        }
                    },
                    {
                        id: 'plugin-3',
                        name: 'VButton',
                        zhName: '按钮',
                        deletable: false,
                        margin: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0
                        },
                        config: {
                            text: '返回',
                            backgroundColor: '#ffffff',
                            action: 'toPage',
                            data: 'start'
                        }
                    }
                ],
                pendants: [],
                deletable:false
            }
        ],
        dialogs: []
    },
    {
        id: '0',
        name: 'TRaffle',
        zhName: '九宫格抽奖',
        config: {
            title: '',
            animation: '',
            backgroundColor: '#FFE1A0',
            backgroundImage: 'https://static.cdn.24haowan.com/jsfm/461394302Banner.png',
            themeColor: ''
        },
        pages: [
            {
                id: 'page-start',
                name: 'start',
                zhName: '活动开始页',
                config: {
                    title: '',
                    animation: '',
                    backgroundColor: '#64b587',
                    backgroundImage: 'https://static.cdn.24haowan.com/jsfm/461394302Banner.png'
                },
                plugins: [
                    {
                        id: 'plugin-1',
                        name: 'VButton',
                        zhName: '下一页按钮',
                        deletable: false,
                        margin: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0
                        },
                        config: {
                            text: '下一页',
                            backgroundColor: '#ffffff',
                            action: 'toPage',
                            data: 'game'
                        }
                    }
                ],
                pendants: [],
                deletable: false
            },
            {
                id: 'page-game',
                name: 'game',
                zhName: '活动主页',
                config: {
                    title: '',
                    animation: 'slide',
                    backgroundColor: '#64b587',
                    backgroundImage: 'https://static.cdn.24haowan.com/jsfm/461394302Banner.png'
                },
                plugins: [
                    {
                        id: 'plugin-1',
                        name: 'VImage',
                        zhName: '图片',
                        deletable: false,
                        margin: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0
                        },
                        config: {
                            url: 'http://bearfile.codebear.cn/avatar.png',
                            width: 100,
                            height: 80
                        }
                    },
                    {
                        id: 'plugin-2',
                        name: 'TVRaffle',
                        zhName: '抽奖组件',
                        deletable: false,
                        margin: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0
                        },
                        config: {
                            textColor: '#000000',
                            itemColor: '#ffffff',
                            backgroundColor: '#fdf5d4',
                            btn: 'http://bearfile.codebear.cn/avatar.png'
                        }
                    },
                    {
                        id: 'plugin-3',
                        name: 'VButton',
                        zhName: '按钮',
                        deletable: false,
                        margin: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0
                        },
                        config: {
                            text: '返回',
                            backgroundColor: '#ffffff',
                            action: 'toPage',
                            data: 'start'
                        }
                    },{
                        id: 'plugin-4',
                        name: 'VImage',
                        zhName: '图片',
                        deletable: false,
                        margin: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0
                        },
                        config: {
                            url: 'http://bearfile.codebear.cn/avatar.png',
                            width: 100,
                            height: 80
                        }
                    }
                ],
                pendants: [],
                deletable:false
            }
        ],
        dialogs: []
    },
    {
        id:'2',
        config: {
            animation:'',
            title:'',
            backgroundImage:'',
            backgroundColor:'#ffe294',
            themeColor: ''
        },
        name:'TRaffle',
        zhName:'九宫格抽奖',
        pages:[{id:'page-raffle',name:'raffle',zhName:'抽奖主页',config:{animation:'slide',title:'',backgroundImage:'https://static.cdn.24haowan.com/jsfm/815061620Banner.png',backgroundColor:'#ffe294'},plugins:[{id:'plugin-5',name:'TRaffleVParticipantsNumber',zhName:'抽奖-参与人数',deletable:true,margin:{top:50,left:0,right:0,bottom:0},config:{}},{id:'plugin-4',name:'TRaffleVLottery',zhName:'九宫格',deletable:false,margin:{top:0,left:0,right:0,bottom:0},config:{textColor:'#000000',itemColor:'#ffffff',backgroundColor:'#fdf5d4'}},{id:'plugin-6',name:'TRaffleVWinningList',zhName:'抽奖-跑马灯',deletable:true,margin:{top:0,left:0,right:0,bottom:0},config:{}},{id:'plugin-7',name:'TRaffleVInviteFriend',zhName:'抽奖-邀请好友',deletable:false,margin:{top:0,left:0,right:0,bottom:0},config:{invitedBtnText:'去邀请'}},{id:'plugin-8',name:'TRaffleVLotteryNotes',zhName:'抽奖-抽奖规则',deletable:true,margin:{top:0,left:0,right:0,bottom:0},config:{}}],pendants:[],deletable:false}],
        dialogs: [{
            id: 'dialog-login',
            name: 'TRaffleDLogin',
            zhName: '登录弹窗'
        }]
    },
    JSON.parse('{"id":"2","config":{"animation":"","title":"","backgroundImage":"","backgroundColor":"#ffe294","themeColor":""},"name":"TRaffle","zhName":"九宫格抽奖","pages":[{"id":"page-raffle","name":"raffle","zhName":"抽奖主页","config":{"animation":"slide","title":"","backgroundImage":"https://static.cdn.24haowan.com/jsfm/815061620Banner.png","backgroundColor":"#ffe294"},"plugins":[{"id":"plugin-5","name":"TRaffleVParticipantsNumber","zhName":"参与人数","deletable":true,"margin":{"top":50},"config":{}},{"id":"plugin-4","name":"TRaffleVLottery","zhName":"九宫格","deletable":false,"margin":{"left":0,"right":0,"top":0,"bottom":0},"config":{"lotteryBtnText":"开始抽奖","lotteryborderBgc":"#f6e7c5","btcBgc":"#FF5D5A","awardCharacteBgc":"","textColor":"#000000","itemColor":"#ffffff","backgroundColor":"#fdf5d4"}},{"id":"plugin-6","name":"TRaffleVWinningList","zhName":"获奖轮播","deletable":true,"margin":{"left":0,"right":0,"top":0,"bottom":0},"config":{}},{"id":"plugin-7","name":"TRaffleVInviteFriend","zhName":"任务列表","deletable":false,"margin":{"left":0,"right":0,"top":0,"bottom":0},"config":{"invitedBtnText":"去邀请","invitedTitle":"点击下方任务，获得抽奖机会","inviteTitleBgc":"","inviteCardBgc":"#fff"}}],"pendants":[{"id":"plugin-8","mode":"fixed","wMode":"fixed","alignH":"right","alignV":"top","fixedType":"absolute","name":"TRaffleVRuleEntry","zhName":"规则入口","deletable":true,"pos":-1,"showInScreen":[0],"position":{"left":0,"right":0,"top":"10px","bottom":0},"margin":{"left":0,"right":0,"top":0,"bottom":0},"config":{"ruleBtnText":"活动规则","ruledescription":""}},{"id":"plugin-9","mode":"fixed","wMode":"fixed","alignH":"right","alignV":"top","fixedType":"absolute","name":"TRaffleVPrizeEntry","zhName":"我的奖品入口","deletable":true,"margin":{"left":0,"right":0,"top":0,"bottom":0},"pos":-1,"showInScreen":[0],"position":{"left":0,"right":0,"top":"30px","bottom":0},"config":{"prizeBtnText":"我的奖品","action":"prizeList"}}],"deletable":false},{"id":"page-prizeList","name":"prizeList","zhName":"我的奖品页","config":{"animation":"slide","title":"","backgroundImage":"https://static.cdn.24haowan.com/jsfm/815061620Banner.png","backgroundColor":"#ffe294"},"plugins":[{"id":"plugin-10","name":"TRaffleVPrizeList","zhName":"内容设置","deletable":true,"margin":{"left":0,"right":0,"top":0,"bottom":0},"config":{"goLotteryPageText":"返回抽奖页","action":"raffle"}}],"pendants":[],"deletable":false}],"dialogs":[{"id":"dialog-login","name":"TRaffleDLogin","zhName":"登录弹窗"},{"id":"dialog-rule","name":"TRaffleDRule","zhName":"规则弹窗"}]}')
];

// Mock.mock(/\/api\/backweb\/activity\/page\/boot/, 'get', {
//     code: 0,
//     data: {
//         pageConfig: JSON.stringify(configList[2])
//     }
// });
// Mock.mock(/\/api\/backweb\/activity\/base\/boot/, 'get', {
//     code: 0,
//     data: {
//         name: '中秋活动',
//         startTime: '2020-05-08 00:00:00',
//         endTime: '2020-05-15 00:00:00',
//         newUserType: 'none',
//         pageConfig: JSON.stringify(configList[3]),
//         stageConfig: JSON.stringify({editor: ['base', 'gift', 'raffle']})
//     }
// });
// Mock.mock(/\/api\/backweb\/activity\/workbench\/boot/, 'get', {
//     code: 0,
//     data: {
//         workbench: {
//             workbenchConfig: JSON.stringify({editor: [{name: 'base'}, {name: 'gift'}, {name: 'raffle'}, {name: 'ui'}]}),
//         }
//     }
// });
// Mock.mock(/\/api\/backweb\/activity\/page\/change/, 'post', {
//     code: 0
// });
// Mock.mock(/\/api\/backweb\/activity\/base\/change/, 'post', {
//     code: 0
// });

// Mock.mock(/\/api\/backweb\/activity\/poster\/list/, 'get', {
//     code: 0,
//     data: {
//         list: [
//             {
//                 config: '{"id":"","name":"","zhName":"模板1","pluginId":"","pageId":"","used":true,"outConfig":{"width":"750","height":"1206","border":{"open":false,"radius":"","width":"","color":""},"backgroundColor":"","backgroundImage":""},"pluginList":[{"type":"text","config":{"text":"{用户昵称}","fontSize":"16","fontColor":"#000000","fontWeight":"bold","textAlign":"center"},"commConfig":{"left":"0","top":"0","width":"750","height":"40","border":{"open":false,"radius":"","width":"","color":""}},"id":"1","hidden":false,"name":"用户昵称"},{"type":"image","config":{"url":"{用户头像}"},"commConfig":{"left":"325","top":"50","width":"100","height":"100","border":{"open":true,"radius":"100","width":"10","color":"#ffffff"}},"id":"2","hidden":false,"name":"用户头像"},{"type":"image","config":{"url":"{活动二维码}"},"commConfig":{"left":"500","top":"956","width":"200","height":"200","border":{"open":false,"radius":"","width":"20","color":"#ffffff"}},"id":"4","hidden":false,"name":"二维码"}]}'
//             }
//         ]
//     }
// });
// Mock.mock(/\/workbench\/iframe/, 'get', 'http://cdn.via.cool/web/vplus/via/h5/index.html');
Mock.mock(/\/workbench\/iframe/, 'get', 'http://localhost:8082');
