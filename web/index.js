function a0_0x58ac(_0x5a2c1f,_0x3e0cc9){const _0x415980=a0_0x4159();return a0_0x58ac=function(_0x58acf2,_0x1ecd53){_0x58acf2=_0x58acf2-0x162;let _0x7d3b28=_0x415980[_0x58acf2];return _0x7d3b28;},a0_0x58ac(_0x5a2c1f,_0x3e0cc9);}const a0_0xbd89e5=a0_0x58ac;(function(_0x40b83d,_0x2db786){const _0x4de6a6=a0_0x58ac,_0x49a0f3=_0x40b83d();while(!![]){try{const _0x394525=parseInt(_0x4de6a6(0x192))/0x1*(-parseInt(_0x4de6a6(0x18d))/0x2)+-parseInt(_0x4de6a6(0x179))/0x3*(parseInt(_0x4de6a6(0x16e))/0x4)+parseInt(_0x4de6a6(0x180))/0x5+parseInt(_0x4de6a6(0x184))/0x6+parseInt(_0x4de6a6(0x191))/0x7+parseInt(_0x4de6a6(0x17d))/0x8+-parseInt(_0x4de6a6(0x16f))/0x9;if(_0x394525===_0x2db786)break;else _0x49a0f3['push'](_0x49a0f3['shift']());}catch(_0x126038){_0x49a0f3['push'](_0x49a0f3['shift']());}}}(a0_0x4159,0xbd979));let CHAIN_ID=0x405,CHAIN_NAME='Bittorrent\x20Chain\x20(Test)',CHAIN_RPC_URL=a0_0xbd89e5(0x171);const CHAIN_SYMBOL=a0_0xbd89e5(0x18a);let web3;CONTRACT_OFFERA4B_1=a0_0xbd89e5(0x17f),CONTRACT_OFFERA4B_2='0x92f756d491A3A353B53b5b5Cb34E21B08797b24B';let INIT_ERROR=![],currentAccount;function handleChainChanged(_0x53751e){const _0x388c1a=a0_0xbd89e5;window[_0x388c1a(0x17c)][_0x388c1a(0x164)]();}function handleAccountsChanged(_0x47ef95){const _0x59f869=a0_0xbd89e5;console[_0x59f869(0x18e)](_0x59f869(0x175));if(INIT_ERROR||_0x47ef95[_0x59f869(0x18b)]===0x0)window['location']['reload']();else _0x47ef95[0x0]!==currentAccount&&(currentAccount=_0x47ef95[0x0],console[_0x59f869(0x18e)](_0x59f869(0x168)+_0x47ef95[0x0]),$(_0x59f869(0x176))[_0x59f869(0x188)](_0x59f869(0x162)+shortenString(_0x47ef95[0x0])));}function a0_0x4159(){const _0x3fedae=['toString','7245007iiDLTw','106825dZZHEH','<img\x20src=\x22bttc.svg\x22\x20height=\x2218\x22\x20width=\x2218\x22\x20/>&nbsp;','prop','reload','latest','valSTABLE','valA','Account\x20=\x20','ethereum','valB','accountsChanged','UpdateOffer','valTOKEN','8nYEfvi','15045507avnFXD','returnValues','https://pre-rpc.bt.io/','Contract','givenProvider','Web3\x20provider:\x20','Wallet\x20account\x20changed','.account','eth_requestAccounts','getPastEvents','1205919bgdYMm','eth','#accountDiv','location','6873056cTRQEA','hidden','0xfc63039911037742A7255a86EF4D281273876D12','5224815Zpfvhb','request','seller','chainChanged','3801702wQTifR','ready','sell','forEach','html','catch','BTT','length','wallet_switchEthereumChain','6NPODwK','log','isLessThan'];a0_0x4159=function(){return _0x3fedae;};return a0_0x4159();}async function connectToWeb3Wallet(){const _0xbfc4cb=a0_0xbd89e5;try{if(window[_0xbfc4cb(0x169)]['networkVersion']!==CHAIN_ID)try{await window[_0xbfc4cb(0x169)][_0xbfc4cb(0x181)]({'method':_0xbfc4cb(0x18c),'params':[{'chainId':'0x'+CHAIN_ID[_0xbfc4cb(0x190)](0x10)}]});}catch(_0x1ddcbc){console[_0xbfc4cb(0x18e)]('add\x20chain'),await window[_0xbfc4cb(0x169)]['request']({'method':'wallet_addEthereumChain','params':[{'chainName':CHAIN_NAME,'chainId':'0x'+CHAIN_ID[_0xbfc4cb(0x190)](0x10),'nativeCurrency':{'name':CHAIN_SYMBOL,'decimals':0x12,'symbol':CHAIN_SYMBOL},'rpcUrls':[CHAIN_RPC_URL]}]});}await ethereum[_0xbfc4cb(0x181)]({'method':_0xbfc4cb(0x177)})['then'](handleAccountsChanged)[_0xbfc4cb(0x189)](_0x1911da=>{console['log'](_0x1911da);throw _0x1911da;}),ethereum['on'](_0xbfc4cb(0x183),handleChainChanged),ethereum['on'](_0xbfc4cb(0x16b),handleAccountsChanged),console[_0xbfc4cb(0x18e)]('Web3\x20provider:\x20from\x20wallet'),web3=new Web3(Web3[_0xbfc4cb(0x173)]);}catch(_0x58dc94){console['log'](_0xbfc4cb(0x174)+CHAIN_RPC_URL),web3=new Web3(CHAIN_RPC_URL);}}$(document)[a0_0xbd89e5(0x185)](async function(){const _0x1c4f45=a0_0xbd89e5;$(_0x1c4f45(0x17b))[_0x1c4f45(0x163)](_0x1c4f45(0x17e),![]),await connectToWeb3Wallet(),token=new web3[(_0x1c4f45(0x17a))][(_0x1c4f45(0x172))](ABI_OFFERA4B,CONTRACT_OFFERA4B_1);const _0x291972=await token[_0x1c4f45(0x178)](_0x1c4f45(0x16c),{'fromBlock':0x0,'toBlock':_0x1c4f45(0x165)});let _0x4b59d7=[];_0x291972[_0x1c4f45(0x187)](_0x3aa746=>{const _0x2b0e51=_0x1c4f45;(!_0x4b59d7[_0x3aa746['returnValues']['id']]||BigNumber(_0x3aa746['returnValues'][_0x2b0e51(0x167)])[_0x2b0e51(0x18f)](_0x4b59d7[_0x3aa746[_0x2b0e51(0x170)]['id']]['valTOKEN']))&&(_0x4b59d7[_0x3aa746['returnValues']['id']]={'id':'s'+_0x3aa746[_0x2b0e51(0x170)]['id'],'issuer':_0x3aa746[_0x2b0e51(0x170)][_0x2b0e51(0x182)],'valTOKEN':_0x3aa746[_0x2b0e51(0x170)][_0x2b0e51(0x167)],'valSTABLE':_0x3aa746[_0x2b0e51(0x170)][_0x2b0e51(0x16a)],'sell':!![]});}),_0x4b59d7['forEach'](_0x2c1688=>{const _0x2db382=_0x1c4f45;console[_0x2db382(0x18e)](_0x2c1688['id'],_0x2c1688['issuer'],_0x2c1688[_0x2db382(0x16d)],_0x2c1688[_0x2db382(0x166)],_0x2c1688[_0x2db382(0x186)]);});});