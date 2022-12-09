let NETWORK
let CONTRACT_MARKETPLACE
let CONTRACT_TOKEN
let CONTRACT_STABLE
let NAME_TOKEN
let NAME_STABLE
let IMG_TOKEN
let TRC20_TOKEN_APPROVE_OWNER
let TRC20_TOKEN_APPROVE_SPENDER
let TRC20_TOKEN_APPROVE_VALUE
let TRC20_STABLE_APPROVE_OWNER
let TRC20_STABLE_APPROVE_SPENDER
let TRC20_STABLE_APPROVE_VALUE
let DECIMALS_TOKEN
let DECIMALS_STABLE
let FEED_TOKEN
let FEED_STABLE
let FEED_URL
let CONTRACT_MARKETPLACE_NETWORK_URL
let HTML_CONN_BADGE
let HTML_CONN_BADGE_SPINNER
let EXPLORER_URL_PREFIX
let TRANSACTION_URL
let ALLOWANCE_FIX_TOKEN
let ALLOWANCE_FIX_STABLE
let TRONGRID_URL_PREFIX

const DECIMALS_8 = 8;
const DECIMALS_6 = 6;
const DECIMALS_2 = 2;
const MAX_LIST_ITEMS = 500;

let yourOffers = [];
let sellOffers = [];
let buyOffers = [];

let eventsBlockTimeStamp = 0;
let yourOffersSet = false;
let buySellOffersSet = false;

let marketplace = null;
let token = null;
let stable = null;
let minValToken = null;
let minValStable = null;
let priceToken = null;
let balanceToken = null;
let balanceStable = null;
let allowanceToken = null;
let allowanceStable = null;

let priceFeedIntervall = null;
let balanceFeedInterval = null;

let createOfferWatcher
let removeOfferWatcher
let acceptOfferWatcher

cropZerosRegEx = /(\.[0-9]*[1-9])0+$|\.0*$/

const AbiCoder = ethers.utils.AbiCoder;
const abiCoder = new AbiCoder();

function shortenString(str) {
    let short = str;
    return short.substr(0, 5) + '...' + short.substr(short.length - 5, short.length);
}

function valueMoveCommaLeft(value, decimals) {
    return BigNumber(value).div(10 ** decimals);
}
function valueMoveCommaRight(value, decimals) {
    return BigNumber(value).times(10 ** decimals);
}

function adjustDecimals(strPrice) {
    let decimals
    let bn = BigNumber(strPrice)

    if (bn.isLessThan(0.01)) {
        decimals = DECIMALS_8
    }
    else if (bn.isLessThan(1)) {
        decimals = DECIMALS_6
    }
    else {
        decimals = DECIMALS_2
    }

    return bn.toFixed(decimals).replace(cropZerosRegEx, '$1')
}

function getPrice() {
    $.ajax({
        url: FEED_URL,
        dataType: "json",
        success: function (data) {
            priceToken = adjustDecimals(BigNumber(data[FEED_TOKEN].usd).div(data[FEED_STABLE].usd).toFixed(DECIMALS_8))
            // console.log("PRICE FEED: " + priceToken + " " + NAME_STABLE + "/" + NAME_TOKEN);
            $(".priceToken").text(priceToken)
        }
    })
}

function startPriceFeed() {
    if (priceFeedIntervall == null) {
        console.log(`STARTING PRICE FEED (${FEED_URL})`)
        getPrice()
        priceFeedIntervall = setInterval(function () {
            getPrice()
        }, 10000);
    }
}

function stopPriceFeed() {
    console.log("STOPPING PRICE FEED")
    if (priceFeedIntervall != null) {
        clearInterval(priceFeedIntervall)
        priceFeedIntervall = null
        console.log("priceFeedIntervall cleared")
    }
}

async function getFromTronWeb() {
    await new Promise(r => setTimeout(r, 100));
    balanceToken = String(await token.balanceOf(window.tronWeb.defaultAddress.base58).call());

    await new Promise(r => setTimeout(r, 100));
    balanceStable = String(await stable.balanceOf(window.tronWeb.defaultAddress.base58).call());
    if (ALLOWANCE_FIX_TOKEN) {
        allowanceToken = String((await token.allowance(window.tronWeb.defaultAddress.base58, CONTRACT_MARKETPLACE).call()).remaining);
    }
    else {
        allowanceToken = String(await token.allowance(window.tronWeb.defaultAddress.base58, CONTRACT_MARKETPLACE).call());
    }

    await new Promise(r => setTimeout(r, 100));
    if (ALLOWANCE_FIX_STABLE) {
        allowanceStable = String((await stable.allowance(window.tronWeb.defaultAddress.base58, CONTRACT_MARKETPLACE).call()).remaining);
    }
    else {
        allowanceStable = String(await stable.allowance(window.tronWeb.defaultAddress.base58, CONTRACT_MARKETPLACE).call());
    }

    await new Promise(r => setTimeout(r, 100));
    minValToken = String(await marketplace.getMinValTOKEN().call())

    await new Promise(r => setTimeout(r, 100));
    minValStable = String(await marketplace.getMinValSTABLE().call())

    // console.log("balanceToken " + balanceToken)
    // console.log("allowanceToken " + allowanceToken)
    // console.log("allowanceStable " + allowanceStable)
    // console.log("minValToken " + minValToken)
    // console.log("minValStable " + minValStable)

    $(".balanceToken").text(valueMoveCommaLeft(balanceToken, DECIMALS_TOKEN).toFixed(DECIMALS_8).replace(cropZerosRegEx, '$1'))
    $(".balanceStable").text(valueMoveCommaLeft(balanceStable, DECIMALS_STABLE).toFixed(DECIMALS_8).replace(cropZerosRegEx, '$1'))
    $(".account").html(`<img src="tron.svg" height="14" width="14" />&nbsp;` + shortenString(window.tronWeb.defaultAddress.base58));
}

async function startTronWebFeed() {
    try {
        if (balanceFeedInterval == null) {
            console.log("STARTING TRONWEB DATA FEED")
            await getFromTronWeb();
            balanceFeedInterval = setInterval(async function () {
                await getFromTronWeb();
            }, 10000);
        }
    }
    catch (err) {
        // window.location.reload();
    }
}

function stopTronWebFeed() {
    console.log("STOPPING TRONWEB DATA FEED ")
    if (balanceFeedInterval != null) {
        clearInterval(balanceFeedInterval)
        balanceFeedInterval = null;
        console.log("balanceFeedInterval cleared")
    }
}

let LOCK = false;
let INITIALIZED = false;
let PREV_ACCOUNT = null;
let ENTERED = false;

$(document).ready(async function () {
    setTradingPair()
});

async function initializeFeeds() {
    startPriceFeed()
    startEventFeed();
}

async function initializeTronWeb() {
    console.log("INITIALIZING TRONWEB")
    try {
        await tronLinkReady()
        await getTronWeb()
        await startTronWebFeed()
        $("#createOfferLink").prop("hidden", false)

    }
    catch (err) {
        console.log("INITIALIZING FAILED:" + err)
        $("#createOfferLink").prop("hidden", true)
        stopTronWebFeed()

    }
}

async function getTronWeb() {
    try {
        const res = await tronLink.request({ method: 'tron_requestAccounts' })
        if (res.code != 200) throw res;
        token = await tronWeb.contract().at(CONTRACT_TOKEN)
        stable = await tronWeb.contract().at(CONTRACT_STABLE)
        marketplace = await tronWeb.contract().at(CONTRACT_MARKETPLACE);
        INITIALIZED = true;
    }
    catch (err) {
        throw err
    }
}

async function tronLinkReady() {
    await new Promise(resolve => {
        const timer = setInterval(() => {
            if (window.tronWeb && window.tronWeb.defaultAddress.base58) {
                clearInterval(timer);
                return resolve();
            }
        }, 100);
    });
}

setInterval(function () {
    const currentAccount = tronWeb.defaultAddress.base58;
    if (!PREV_ACCOUNT && currentAccount) {
        PREV_ACCOUNT = currentAccount
    }
    else if (PREV_ACCOUNT && PREV_ACCOUNT != currentAccount) {
        window.location.reload()
    }
}, 1000);

window.addEventListener('message', async function (e) {
    if (e.data.message && e.data.message.action == "setAccount") {
        if (ENTERED && !LOCK) {
            LOCK = true;
            addr = e.data.message.data.address
            if (addr == undefined || addr == null || !addr) {
                window.location.reload();
            }
            if (!INITIALIZED) {
                await initializeTronWeb();
            }
            else {
                await getTronWeb()
                    .then(() => {
                        //OK
                    })
                    .catch((err) => {
                        this.window.location.reload()
                    })
            }
            LOCK = false;
        }
    }
})

function searchBinaryASC(arr, x, param) {
    let start = 0, end = arr.length - 1;
    while (start <= end) {
        let mid = Math.floor((start + end) / 2);
        if (BigNumber(arr[mid][param]).isEqualTo(x)) return { found: mid, next: (mid + 1) };
        else if (BigNumber(arr[mid][param]).isLessThan(x))
            start = mid + 1;
        else
            end = mid - 1;
    }
    return { found: null, next: start };
}

function searchBinaryDSC(arr, x, param) {
    let start = 0, end = arr.length - 1;
    while (start <= end) {
        let mid = Math.floor((start + end) / 2);
        if (BigNumber(arr[mid][param]).isEqualTo(x)) return { found: mid, next: (mid + 1) };
        else if (BigNumber(arr[mid][param]).isGreaterThan(x))
            start = mid + 1;
        else
            end = mid - 1;
    }
    return { found: null, next: start };
}

function flashOffer(id) {
    $("#cancel_" + id).removeClass("flash")
    $("#buy_" + id).removeClass("flash")
    $("#sell_" + id).removeClass("flash")

    setTimeout(function () {
        $("#cancel_" + id).addClass("flash")
        $("#buy_" + id).addClass("flash")
        $("#sell_" + id).addClass("flash")
    }, 100);
}

function addOffer(record) {
    console.log(record)
    console.log(record.issuer + " " + window.tronWeb.defaultAddress.hex);
    if (record.issuer == window.tronWeb.defaultAddress.hex) {
        yourOffers.push(record)
        $(".myoffers").append(yourOfferToHTML(record));
        $(".myoffersCount").text(`(${yourOffers.length})`)
    }
    if (record.sell == true) {
        const search = searchBinaryASC(sellOffers, record.price, "price")
        console.log(`search.next = ${search.next}`)
        console.log(`sellOffers.length = ${sellOffers.length}`)
        if (search.next < sellOffers.length) {
            console.log(`insert: ${record.id}`)
            console.log(`before: ${sellOffers[search.next].id}`)
            console.log(sellOfferToHTML(record))
            $(`#buy_${sellOffers[search.next].id}`).before(sellOfferToHTML(record))
            sellOffers.splice(search.next, 0, record);
            if (sellOffers.length > MAX_LIST_ITEMS) {
                $(".asks tr").last().remove()
                sellOffers = sellOffers.slice(0, MAX_LIST_ITEMS);
            }
            $(".asksCount").text(`(${sellOffers.length})`)
        }
        else {
            if (sellOffers.length < MAX_LIST_ITEMS) {
                console.log(`append: ${record.id}`)
                sellOffers.push(record)
                $(".asks").append(sellOfferToHTML(record));
                $(".asksCount").text(`(${sellOffers.length})`)
            }
        }
    }
    else {
        const search = searchBinaryDSC(buyOffers, record.price, "price")
        console.log(`search.next = ${search.next}`)
        console.log(`buyOffers.length = ${buyOffers.length}`)
        if (search.next < buyOffers.length) {
            console.log(`insert: ${record.id}`)
            console.log(`before: ${buyOffers[search.next].id}`)
            console.log(buyOfferToHTML(record))
            $(`#sell_${buyOffers[search.next].id}`).before(buyOfferToHTML(record))
            buyOffers.splice(search.next, 0, record);
            if (buyOffers.length > MAX_LIST_ITEMS) {
                $(".bids tr").last().remove()
                buyOffers = buyOffers.slice(0, MAX_LIST_ITEMS);
            }
            $(".bidsCount").text(`(${buyOffers.length})`)
        }
        else {
            if (buyOffers.length < MAX_LIST_ITEMS) {
                console.log(`append: ${record.id}`)
                buyOffers.push(record)
                $(".bids").append(sellOfferToHTML(record));
                $(".bidsCount").text(`(${buyOffers.length})`)
            }
        }
    }
}

function removeOffer(id) {
    const search = searchBinaryASC(yourOffers, id, "id")
    if (search.found != null) {
        yourOffers.splice(search.found, 1)
        $("#cancel_" + id).remove()
        $(".myoffersCount").text(`(${yourOffers.length})`)
    }

    let deleted = false;
    let i = 0;
    while (!deleted && i < sellOffers.length) {
        if (sellOffers[i].id == id) {
            sellOffers.splice(i, 1)
            $("#buy_" + id).remove()
            $(".asksCount").text(`(${sellOffers.length})`)
            deleted = true;
        }
        i++;
    }

    deleted = false;
    i = 0;
    while (!deleted && i < buyOffers.length) {
        if (buyOffers[i].id == id) {
            buyOffers.splice(i, 1)
            $("#sell_" + id).remove()
            $(".bidsCount").text(`(${buyOffers.length})`)
            deleted = true;
        }
        i++;
    }
    $(`.accept-offer-max-amount[data-offer-id="${id}"]`).text("0")
    $(`.accept-offer-max-volume[data-offer-id="${id}"]`).text("0")
}

function updateOffer(id, newValTOKEN, newValSTABLE, newExactValSTABLE) {
    let bnnvt = BigNumber(newValTOKEN)

    if (bnnvt.isEqualTo(0)) {
        console.log(`updateOffer -> removeOffer (id: ${id})`)
        removeOffer(id)
    }
    else {
        let updateHTML = false;

        let updated = false;
        let i = 0;
        while (!updated && i < yourOffers.length) {
            if (yourOffers[i].id == id) {
                if (bnnvt.isLessThan(yourOffers[i].valTOKEN)) {
                    console.log(`updateOffer (id: ${id}) - yourOffers`)
                    yourOffers[i].valTOKEN = newValTOKEN
                    yourOffers[i].valSTABLE = newValSTABLE
                    yourOffers[i].exactValSTABLE = newExactValSTABLE
                    updated = true;
                    updateHTML = true;
                }
            }
            i++;
        }

        updated = false;
        i = 0;
        while (!updated && i < sellOffers.length) {
            if (sellOffers[i].id == id) {
                if (bnnvt.isLessThan(sellOffers[i].valTOKEN)) {
                    console.log(`updateOffer (id: ${id}) - sellOffers`)
                    sellOffers[i].valTOKEN = newValTOKEN
                    sellOffers[i].valSTABLE = newValSTABLE
                    sellOffers[i].exactValSTABLE = newExactValSTABLE
                    updated = true;
                    updateHTML = true;
                }
            }
            i++;
        }

        updated = false;
        i = 0;
        while (!updated && i < buyOffers.length) {
            if (buyOffers[i].id == id) {
                if (bnnvt.isLessThan(buyOffers[i].valTOKEN)) {
                    console.log(`updateOffer (id: ${id}) - buyOffers`)
                    buyOffers[i].valTOKEN = newValTOKEN
                    buyOffers[i].valSTABLE = newValSTABLE
                    buyOffers[i].exactValSTABLE = newExactValSTABLE
                    updated = true;
                    updateHTML = true;
                }
            }
            i++;
        }

        if (updateHTML) {
            console.log(`updateOffer (id: ${id}) - update HTML`)

            console.log(adjustDecimals(newValTOKEN))
            console.log(adjustDecimals(newValSTABLE))
            console.log(`.amount_${id}`)
            console.log(`.volume_${id}`)

            $(`.amount_${id}`).text(adjustDecimals(newValTOKEN))
            $(`.volume_${id}`).text(adjustDecimals(newValSTABLE))
            $('.accept-offer-max-amount[data-offer-id="' + id + '"]').text(newValTOKEN.replace(cropZerosRegEx, '$1'))
            $('.accept-offer-max-volume[data-offer-id="' + id + '"]').text(newValSTABLE.replace(cropZerosRegEx, '$1'))
            flashOffer(id)
        }
    }

}

function sortYourOffers() {
    yourOffers.sort((a, b) => {
        let x = BigNumber(a.id)
        let y = BigNumber(b.id)
        if (x.isLessThan(y)) {
            return -1;
        }
        if (x.isGreaterThan(y)) {
            return 1;
        }
        return 0;
    })
}

function sortSellOffers() {
    sellOffers.sort((a, b) => {
        let x = BigNumber(a.price)
        let y = BigNumber(b.price)
        if (x.isLessThan(y)) {
            return -1;
        }
        if (x.isGreaterThan(y)) {
            return 1;
        }
        return 0;
    })
    sellOffers = sellOffers.slice(0, MAX_LIST_ITEMS);
}

function sortBuyOffers() {
    buyOffers.sort((a, b) => {
        let x = BigNumber(a.price)
        let y = BigNumber(b.price)
        if (x.isGreaterThan(y)) {
            return -1;
        }
        if (x.isLessThan(y)) {
            return 1;
        }
        return 0;
    })
    buyOffers = buyOffers.slice(0, MAX_LIST_ITEMS);
}

async function getCurrentOffers(forSellandBuy) {
    if (forSellandBuy) {
        sellOffers = []
        buyOffers = []
    }
    else {
        yourOffers = []
    }

    const options = {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
            owner_address: "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb", // Black hole address
            contract_address: CONTRACT_MARKETPLACE,
            function_selector: 'getOffers(uint256,uint256)',
            parameter: '0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000270F', //fromIdx = 0, toIdx = 9999
            visible: true
        })
    };

    return await fetch(`${TRONGRID_URL_PREFIX}/wallet/triggerconstantcontract`, options)
        .then(response => response.json())
        .then(response => {
            const params = abiCoder.decode(['uint256[]', 'address[]', 'uint256[]', 'uint256[]', 'bool[]'], `0x${response.constant_result[0]}`);
            params[0].forEach((p, i) => {
                let row = {
                    "id": String(p),
                    "issuer": "41" + params[1][i].substr(2).toLowerCase(),
                    "valTOKEN": valueMoveCommaLeft(String(params[2][i]), DECIMALS_TOKEN).toFixed(DECIMALS_8),
                    "valSTABLE": valueMoveCommaLeft(String(params[3][i]), DECIMALS_STABLE).toFixed(DECIMALS_8),
                    "sell": params[4][i],
                    "price": String(valueMoveCommaLeft(String(params[3][i]), DECIMALS_STABLE).div(valueMoveCommaLeft(String(params[2][i]), DECIMALS_TOKEN)).toFixed(DECIMALS_8)),
                    "exactValSTABLE": String(params[3][i])
                }

                if (forSellandBuy) {
                    if (row.sell == true) {
                        sellOffers.push(row)
                    }
                    else {
                        buyOffers.push(row)
                    }
                }
                else {
                    if (row.issuer == window.tronWeb.defaultAddress.hex) {
                        yourOffers.push(row)
                    }
                }
            })

            if (forSellandBuy) {
                sortSellOffers()
                sortBuyOffers()
                displayBuySellOffers()
                buySellOffersSet = true;
            }
            else {
                sortYourOffers()
                displayYourOffers()
                yourOffersSet = true
            }

            eventsBlockTimeStamp = response.transaction.raw_data.timestamp;
        })
        .catch(err => console.error(typeof err));
}

async function getEventsOnePage(min_block_timestamp, fingerprint) {
    const options = {
        method: "GET",
        headers: { Accept: "application/json" }
    };

    let fetchURL = `${TRONGRID_URL_PREFIX}/v1/contracts/${CONTRACT_MARKETPLACE}/events?limit=100&min_block_timestamp=${min_block_timestamp}&order_by=block_timestamp,asc&search_internal=false`;

    if (fingerprint) {
        fetchURL += "&fingerprint=" + fingerprint;
    }
    // console.log(fetchURL)
    return await fetch(fetchURL, options)
        .then((response) => response.json())
        .then((response) => {
            return response;
        })
        .catch((err) => {
            console.error(err);
        });
}

async function processNewEvents(min_block_timestamp) {
    let fingerprint = undefined;
    let events = undefined;

    while (true) {
        events = undefined;
        while (!events) {
            events = await getEventsOnePage(min_block_timestamp, fingerprint);
            await new Promise((r) => setTimeout(r, 100));
        }
        events.data.forEach(event => {
            eventsBlockTimeStamp = event.block_timestamp;
            switch (event.event_name) {
                case "CreateOffer":
                    console.log(`CreateOffer Event: ${event.result.offerId}`);
                    addOffer({
                        "id": event.result.offerId,
                        "issuer": "41" + event.result.issuer.substr(2).toLowerCase(),
                        "valTOKEN": valueMoveCommaLeft(event.result.valTOKEN, DECIMALS_TOKEN).toFixed(DECIMALS_8),
                        "valSTABLE": valueMoveCommaLeft(event.result.valSTABLE, DECIMALS_STABLE).toFixed(DECIMALS_8),
                        "sell": (event.result.sell == "true") ? true : false,
                        "price": String(valueMoveCommaLeft(event.result.valSTABLE, DECIMALS_STABLE).div(valueMoveCommaLeft(event.result.valTOKEN, DECIMALS_TOKEN)).toFixed(DECIMALS_8)),
                        "exactValSTABLE": String(event.result.valSTABLE)
                    })
                    break;
                case "RemoveOffer":
                    console.log(`RemoveOffer Event: ${event.result.offerId}`);
                    removeOffer(event.result.offerId)
                    break;
                case "AcceptOffer":
                    console.log(`AcceptOffer Event: ${event.result.offerId}`);
                    updateOffer(event.result.offerId, valueMoveCommaLeft(event.result.newValTOKEN, DECIMALS_TOKEN).toFixed(DECIMALS_8), valueMoveCommaLeft(event.result.newValSTABLE, DECIMALS_STABLE).toFixed(DECIMALS_8), String(event.result.newValSTABLE))
                    break;
                default:
                // do nothing
            }
        });
        fingerprint = events.meta.fingerprint;
        if (!fingerprint) {
            break;
        }
    }
}

async function startEventFeed() {
    try {
        console.log("STARTING EVENT FEED")
        while (true) {
            if (!buySellOffersSet) {
                await getCurrentOffers(true); // read buySellOffers only
            }
            if (INITIALIZED && !yourOffersSet) {
                await getCurrentOffers(false); // read yourOffers only
            }
            await processNewEvents(eventsBlockTimeStamp + 1000);
            await new Promise((r) => setTimeout(r, 1000));
        }
    }
    catch (err) {
        // window.location.reload();
    }
}

async function getOffers() {
    const offers = await marketplace.getOffers(0, 1000).call();
    yourOffers = []
    sellOffers = []
    buyOffers = []

    for (let i = 0; i < offers[0].length; i++) {
        let row = {
            "id": String(offers[0][i]),
            "issuer": tronWeb.address.fromHex(offers[1][i]),
            "valTOKEN": valueMoveCommaLeft(String(offers[2][i]), DECIMALS_TOKEN).toFixed(DECIMALS_8),
            "valSTABLE": valueMoveCommaLeft(String(offers[3][i]), DECIMALS_STABLE).toFixed(DECIMALS_8),
            "sell": offers[4][i],
            "price": String(valueMoveCommaLeft(String(offers[3][i]), DECIMALS_STABLE).div(valueMoveCommaLeft(String(offers[2][i]), DECIMALS_TOKEN)).toFixed(DECIMALS_8)),
            "exactValSTABLE": String(offers[3][i])
        }
        if (row.issuer == window.tronWeb.defaultAddress.base58) {
            yourOffers.push(row)
        }
        if (row.sell == true) {
            sellOffers.push(row)

        }
        else {
            buyOffers.push(row)
        }
    }

    sortYourOffers()
    sortSellOffers()
    sortBuyOffers()
}

function yourOfferToHTML(record) {
    let html = '<tr id="cancel_' + record.id + '" class="flash">'
    html += '<td>' + record.id + '</td>'
    html += '<td class="text-success"> ' + (record.sell ? 'Sell' : 'Buy') + '</td>'
    html += '<td class="amount_' + record.id + '">' + adjustDecimals(record.valTOKEN) + '</td>'
    html += '<td class="text-success">' + adjustDecimals(record.price) + '</td>'
    html += '<td class="volume_' + record.id + '">' + adjustDecimals(record.valSTABLE) + '</td>'
    html += '<td style="text-align:right"><a href style="text-decoration: none;outline : none;" data-bs-toggle="modal" data-bs-target="#CancelOfferModal" data-bs-id="' + record.id + '"><span class="badge rounded-pill bg-success text-dark ">Cancel</span></a></td>'
    html += '</tr>'
    return html
}

function sellOfferToHTML(record) {
    let html = '<tr id="buy_' + record.id + '" class="flash">'
    html += '<td class="amount_' + record.id + '">' + adjustDecimals(record.valTOKEN) + '</td>'
    html += '<td class="text-success">' + adjustDecimals(record.price) + '</td>'
    html += '<td class="volume_' + record.id + '">' + adjustDecimals(record.valSTABLE) + '</td>'
    html += '<td id="buy_btn_active_' + record.id + '" class="buy_btn_active" style="text-align:right" hidden><a href style="text-decoration: none;outline : none;" data-bs-toggle="modal" data-bs-target="#AcceptOfferModal" data-bs-id="' + record.id + '" data-bs-sell="false"><span class="badge rounded-pill bg-success text-dark">Buy</span></a></td>'
    html += '<td id="buy_btn_inactive_' + record.id + '" class="buy_btn_inactive" style="text-align:right"><span class="badge rounded-pill bg-secondary text-dark">Buy</span></td>'
    html += '</tr>'
    return html;

}

function buyOfferToHTML(record) {
    let html = '<tr id="sell_' + record.id + '" class="flash">'
    html += '<td class="amount_' + record.id + '">' + adjustDecimals(record.valTOKEN) + '</td>'
    html += '<td class="text-success">' + adjustDecimals(record.price) + '</td>'
    html += '<td class="volume_' + record.id + '">' + adjustDecimals(record.valSTABLE) + '</td>'
    html += '<td id="sell_btn_active_' + record.id + '" class="sell_btn_active" style="text-align:right" hidden><a href style="text-decoration: none;outline : none;" data-bs-toggle="modal"  data-bs-target="#AcceptOfferModal" data-bs-id="' + record.id + '" data-bs-sell="true"><span class="badge rounded-pill bg-success text-dark">Sell</span></a></td>'
    html += '<td id="sell_btn_inactive_' + record.id + '" class="sell_btn_inactive" style="text-align:right"><span class="badge rounded-pill bg-secondary text-dark">Sell</span></td>'
    html += '</tr>'
    return html;

}

function displayBuySellOffers() {
    $(".asks").empty()
    $(".bids").empty()

    sellOffers.forEach(record => {
        $(".asks").append(sellOfferToHTML(record));
    });
    $(".asksCount").text("(" + sellOffers.length + ")")

    buyOffers.forEach(record => {
        $(".bids").append(buyOfferToHTML(record));
    });
    $(".bidsCount").text("(" + buyOffers.length + ")")
}

function displayYourOffers() {
    $(".myoffers").empty()
    $(".buy_btn_inactive").prop("hidden", true)
    $(".buy_btn_active").prop("hidden", false)
    $(".sell_btn_inactive").prop("hidden", true)
    $(".sell_btn_active").prop("hidden", false)
    yourOffers.forEach(record => {
        $(".myoffers").append(yourOfferToHTML(record));
        $("#buy_btn_active_" + record.id).prop("hidden", true)
        $("#buy_btn_inactive_" + record.id).prop("hidden", false)
        $("#sell_btn_active_" + record.id).prop("hidden", true)
        $("#sell_btn_inactive_" + record.id).prop("hidden", false)
    });
}

function displayAllOffers() {
    $(".asks").empty()
    $(".bids").empty()
    $(".myoffers").empty()
    yourOffers.forEach(record => {
        $(".myoffers").append(yourOfferToHTML(record));
    });
    $(".myoffersCount").text("(" + yourOffers.length + ")")

    sellOffers.forEach(record => {
        $(".asks").append(sellOfferToHTML(record));
    });
    $(".asksCount").text("(" + sellOffers.length + ")")

    buyOffers.forEach(record => {
        $(".bids").append(buyOfferToHTML(record));
    });
    $(".bidsCount").text("(" + buyOffers.length + ")")
}

function setInputFilter(textbox, inputFilter) {
    ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop", "blur", "focus"].forEach(function (event) {
        textbox.addEventListener(event, function () {
            if (inputFilter(this.value)) {
                this.oldValue = this.value;
                this.oldSelectionStart = this.selectionStart;
                this.oldSelectionEnd = this.selectionEnd;
            } else if (this.hasOwnProperty("oldValue")) {
                this.value = this.oldValue;
                this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
            } else {
                this.value = "";
            }

            if (event == "blur") {
                if (this.value == "" || this.value <= 0) {
                    $("#" + textbox.id).val(BigNumber(0).toFixed(DECIMALS_8))
                    this.value = BigNumber(0).toFixed(DECIMALS_8)
                } else {
                    $("#" + textbox.id).val(BigNumber($("#" + textbox.id).val()).toFixed(DECIMALS_8))
                }
            }

            if (textbox.id == "amount" || textbox.id == "amountAccept") {
                const priceVal = $(".price").val();
                if (priceVal == "" || priceVal <= 0 || this.value == "" || this.value <= 0) {
                    $(".volume").val(BigNumber(0).toFixed(DECIMALS_8))
                }
                else {
                    $(".volume").val(BigNumber(BigNumber(priceVal).times(this.value).toFixed(DECIMALS_STABLE)).toFixed(DECIMALS_8))
                    if (event == "blur") {
                        $(".amount").val(BigNumber(BigNumber($(".volume").val()).div(priceVal).toFixed(DECIMALS_TOKEN)).toFixed(DECIMALS_8))
                    }
                }
            }
            else if (textbox.id == "volume" || textbox.id == "volumeAccept") {
                const priceVal = $(".price").val();
                console.log('textbox.id == "volume" val=' + this.val)

                if (priceVal == "" || priceVal <= 0 || this.value == "" || this.value <= 0) {
                    $(".amount").val("")
                }
                else {
                    $(".amount").val(BigNumber(BigNumber(this.value).div(priceVal).toFixed(DECIMALS_TOKEN)).toFixed(DECIMALS_8))
                    if (event == "blur") {
                        $(".volume").val(BigNumber(BigNumber(priceVal).times($(".amount").val()).toFixed(DECIMALS_STABLE)).toFixed(DECIMALS_8))
                    }
                }
            }
            else if (textbox.id == "price") {
                const amountVal = $(".amount").val();
                console.log('textbox.id == "price" val=' + this.val)
                if (this.value == "" || this.value <= 0 || amountVal == "" || amountVal <= 0) {
                    $(".amount").val("")
                    $(".volume").val("")
                }
                else {
                    $(".volume").val(BigNumber(BigNumber(this.value).times(amountVal).toFixed(DECIMALS_STABLE)).toFixed(DECIMALS_8))
                }
            }
        });
    });
}

setInputFilter(document.getElementById("amount"), function (value) {
    return /^-?\d*[.]?\d{0,8}$/.test(value);
});
setInputFilter(document.getElementById("price"), function (value) {
    return /^-?\d*[.]?\d{0,8}$/.test(value);
});
setInputFilter(document.getElementById("volume"), function (value) {
    return /^-?\d*[.]?\d{0,8}$/.test(value);
});
setInputFilter(document.getElementById("amountAccept"), function (value) {
    return /^-?\d*[.]?\d{0,8}$/.test(value);
});
setInputFilter(document.getElementById("volumeAccept"), function (value) {
    return /^-?\d*[.]?\d{0,8}$/.test(value);
});


$(function () {
    $("#setMaxAmountTokenCreateOffer").click(function (e) {
        e.preventDefault();
        if ($(".amount").prop("disabled") != true) {
            $(".amount").val(valueMoveCommaLeft(balanceToken, DECIMALS_TOKEN).toFixed(DECIMALS_8));
            document.getElementById("amount").focus();
        }
    });
    $("#setMaxVolumeStableCreateOffer").click(function (e) {
        e.preventDefault();
        if ($(".volume").prop("disabled") != true) {
            $(".volume").val(valueMoveCommaLeft(balanceStable, DECIMALS_STABLE).toFixed(DECIMALS_8));
            document.getElementById("volume").focus();
        }
    });
    $("#setPriceTokenCreateOffer").click(function (e) {
        e.preventDefault();
        if ($(".price").prop("disabled") != true) {
            $(".price").val(priceToken);
            document.getElementById("price").focus();
        }
    });
    $("#setMaxAmountTokenAcceptOffer").click(function (e) {
        e.preventDefault();
        if ($(".amount").prop("disabled") != true) {
            $(".amount").val($(".accept-offer-max-amount").text())
            document.getElementById("amountAccept").focus();
        }
    });
    $("#setMaxVolumeStableAcceptOffer").click(function (e) {
        e.preventDefault();
        if ($(".volume").prop("disabled") != true) {
            $(".volume").val($(".accept-offer-max-volume").text())
            document.getElementById("volumeAccept").focus();
        }
    });
});

// MODALS - On Show Event Listener (CreateOfferModal)
var createOfferModal = document.getElementById('CreateOfferModal')
createOfferModal.addEventListener('show.bs.modal', function (event) {
    // console.log("On Show Event Listener (CreateOfferModal) " + BigNumber(priceToken).toFixed(DECIMALS_8))
    // console.log("priceToken" + priceToken)

    if (priceToken != null) {
        $(".price").val(BigNumber(priceToken).toFixed(DECIMALS_8));
    }
    $('#buy').prop('checked', false);
    $('#sell').prop('checked', false);
    $(".amount").val("");
    $(".volume").val("");
    $(".validationMsg").text("");
    $(".submitBtn").prop("hidden", false)
    $(".submitBtn").prop("disabled", false)
    $('#buy').prop("disabled", false)
    $('#sell').prop("disabled", false)
    $(".amount").prop("disabled", false)
    $(".price").prop("disabled", false)
    $(".volume").prop("disabled", false)
})

// MODALS - On Show Event Listener (AcceptOfferModal)
var createOfferModal = document.getElementById('AcceptOfferModal')
createOfferModal.addEventListener('show.bs.modal', function (event) {

    let acceptOfferId = String(event.relatedTarget.getAttribute('data-bs-id'))

    let isSell = (event.relatedTarget.getAttribute('data-bs-sell') == "true") ? true : false

    let offer = null

    if (isSell) { //sell from buyOffers
        let i = 0
        let ret = false;
        while (ret == false && i < buyOffers.length) {
            if (buyOffers[i].id == acceptOfferId) {
                offer = buyOffers[i]
                ret = true;
            }
            i++;
        }
        $(".accept-offer-type").text("Sell " + NAME_TOKEN)
    }
    else { //buy from sellOffers
        let i = 0
        let ret = false;
        while (ret == false && i < sellOffers.length) {
            if (sellOffers[i].id == acceptOfferId) {
                offer = sellOffers[i]
                ret = true;
            }
            i++;
        }
        $(".accept-offer-type").text("Buy " + NAME_TOKEN)
    }

    $("#AcceptOfferModal").attr('data-offer-id', acceptOfferId)
    $("#AcceptOfferModal").attr('data-offer-sell', isSell)
    $(".price").val(offer.price);
    $(".amount").val(offer.valTOKEN);
    $(".accept-offer-max-amount").text(offer.valTOKEN.replace(cropZerosRegEx, '$1'));
    $(".accept-offer-max-amount").attr('data-offer-id', acceptOfferId)
    $(".volume").val(offer.valSTABLE);
    $(".accept-offer-max-volume").text(offer.valSTABLE.replace(cropZerosRegEx, '$1'));
    $(".accept-offer-max-volume").attr('data-offer-id', acceptOfferId)
    $(".accept-offer-max-volume").attr('data-exact-val-stable', offer.exactValSTABLE)
    $(".validationMsg").text("");

    $(".submitBtn").prop("hidden", false)
    $(".submitBtn").prop("disabled", false)
    $(".amount").prop("disabled", false)
    $(".price").prop("disabled", true)
    $(".volume").prop("disabled", false)
})


// MODALS - On Show Event Listener (CancelOfferModal)
var createOfferModal = document.getElementById('CancelOfferModal')
createOfferModal.addEventListener('show.bs.modal', function (event) {

    let cancelOfferId = event.relatedTarget.getAttribute('data-bs-id')
    $('#cancel').prop('checked', false);
    $('#cancel').prop('value', cancelOfferId)
    $('#cancel').prop('disabled', false)
    $('.cancelOfferId').text("#" + cancelOfferId)
    $(".validationMsg").text("");
    $(".submitBtn").prop("hidden", false)
    $(".submitBtn").prop("disabled", false)
})


async function sendTransaction(transactionName, transactionFN, watcherFN, watchFilters) {
    console.log("sendTransaction (" + transactionName + "): START")
    let transactionError = false;

    $(".validationMsg").html('<div class="spinner-border spinner-border-sm text-warning" role="status"><span class="visually-hidden">Waiting...</span></div> <span class="text-warning">Waiting for signature...</span>');
    try {

        let transactionId = await transactionFN().send()

        console.log("sendTransaction (" + transactionName + "): WAITING FOR CONFIRMATION")

        $(".validationMsg").html(`<div class="spinner-border spinner-border-sm text-warning" role="status"><span class="visually-hidden">Waiting...</span></div> <span class="text-warning">Waiting for ${transactionName} transaction <a href="${TRANSACTION_URL}${transactionId}" target="_blank" class="text-warning">${shortenString(transactionId)}</a> to be confirmed...</span>`);

        let eventWatch;
        let eventWatchStopped = false;
        try {
            eventWatch = await watcherFN().watch({ filters: watchFilters }, (err, res) => {

                if (res) {
                    $(".validationMsg").html(`<span class="text-success">${transactionName} transaction <a href="${TRANSACTION_URL}${transactionId}" target="_blank" class="text-success">${shortenString(transactionId)}</a> confirmed</span>`);
                    eventWatch.stop()
                    eventWatchStopped = true;
                    console.log("sendTransaction (" + transactionName + "): CONFIRMED")
                }
                if (err) {
                    console.log(err);
                }
            })
        }
        catch (err) {
            $(".validationMsg").html(`<span class="text-danger">${transactionName} transaction <a href="${TRANSACTION_URL}${transactionId}" target="_blank" class="text-danger">${shortenString(transactionId)}</a> confirmation failed</span>`);
            eventWatch.stop()
            eventWatchStopped = true;
            transactionError = true;
        }

        setTimeout(function () {
            if (!eventWatchStopped) {
                $(".validationMsg").html(`<span class="text-danger">${transactionName} transaction <a href="${TRANSACTION_URL}${transactionId}" target="_blank" class="text-danger">${shortenString(transactionId)}</a> confirmation timeout. Please check confirmation status manually</span>`);
                if (eventWatch) { eventWatch.stop(); }
                eventWatchStopped = true;
                transactionError = true;
            }
        }, 60000);

        await new Promise(resolve => {
            const eventWatchStoppedInterval = setInterval(() => {
                if (eventWatchStopped) {
                    resolve();
                    clearInterval(eventWatchStoppedInterval);
                };
            }, 1000);
        });

    } catch (err) {
        let msg;
        if (err.message) {
            msg = err.message
            if (msg == "AccountResourceInsufficient error") {
                msg = "Unable to confirm transaction due to insufficient funds"
            }
        }
        else {
            msg = err
        }
        $(".validationMsg").html('<span class="text-danger">' + msg + '</span>');
        return [true, true];
    }
    return [false, transactionError];
}

async function setTradingPair() {

    const queryString = window.location.search;

    const urlParams = new URLSearchParams(queryString);
    let pair = urlParams.get('pair')

    if (!pair) {
        pair = "btc_usdt"
    }


    switch (pair) {
        case "btc_usdt":
            NETWORK = "Bittorrent Chain (Test)";
            CONTRACT_OFFERA4B_1 = "0xfc63039911037742A7255a86EF4D281273876D12";
            CONTRACT_OFFERA4B_2 = "0x92f756d491A3A353B53b5b5Cb34E21B08797b24B";
            // CONTRACT_TOKEN = "TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9";
            // CONTRACT_STABLE = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
            NAME_TOKEN = "BTC"
            NAME_STABLE = "USDT"
            IMG_TOKEN = "btc.svg"
            DECIMALS_TOKEN = 8;
            DECIMALS_STABLE = 6;
            FEED_TOKEN = "bitcoin";
            FEED_STABLE = "tether";
            EXPLORER_URL_PREFIX = "https://tronscan.io";
            break;
    }

    if (NETWORK) {
        FEED_URL = "https://api.coingecko.com/api/v3/simple/price?ids=" + FEED_TOKEN + "," + FEED_STABLE + "&vs_currencies=usd";
        CONTRACT_MARKETPLACE_NETWORK_URL = EXPLORER_URL_PREFIX + "/#/contract/" + CONTRACT_OFFERA4B_1 + "/code"

        // let networkSuffix = "";
        // if (NETWORK == "Nile Testnet") {
        //     networkSuffix = `<span style="font-size:x-small">&nbsp;(Test)</span>`;
        // }
        HTML_CONN_BADGE = `<img src="${IMG_TOKEN}" height="24px" width="24px" />&nbsp;&nbsp;${NAME_TOKEN}/${NAME_STABLE}</div>`;

        // TRANSACTION_URL = EXPLORER_URL_PREFIX + "/#/transaction/";

        $("#conn_badge").html(HTML_CONN_BADGE);
        $(".contractMarketplaceCodeURL").prop("href", CONTRACT_MARKETPLACE_NETWORK_URL)
        $(".tokenName").text(NAME_TOKEN)
        $(".stableName").text(NAME_STABLE)
        $(".stablePerTokenName").text(NAME_STABLE + "/" + NAME_TOKEN)
        $("#FooterContract").prop("hidden", false)
        $("#accountDiv").prop("hidden", false)
        $("#CurrentPrice").prop("hidden", false)

        initializeFeeds();

        ENTERED = true;
        LOCK = true
        await initializeTronWeb().finally(() => {
            LOCK = false
        })
    }
}

$(function () {
    'use strict'
    var formsCreateOffer = document.querySelectorAll('.create-offer-validation')
    var formsAcceptOffer = document.querySelectorAll('.accept-offer-validation')
    var formsCancelOffer = document.querySelectorAll('.cancel-offer-validation')

    // MODALS - On Submit Event Listeners (CreateOfferModal)
    Array.prototype.slice.call(formsCreateOffer)
        .forEach(function (form) {
            form.addEventListener('submit', async function (event) {
                event.preventDefault()
                event.stopPropagation()

                let isBuy = document.getElementById("buy").checked;
                let isSell = document.getElementById("sell").checked;
                let amountVal = $(".amount").val();
                let priceVal = $(".price").val();
                let volumeVal = $(".volume").val();

                let validationError = false;
                let transactionError = false;

                if ((!isBuy && !isSell) || (isBuy && isSell)) {
                    $(".validationMsg").html('<span class="text-danger">Please choose either Buy ' + NAME_TOKEN + ' or Sell ' + NAME_TOKEN + '</span>');
                    validationError = true;
                }
                else if (amountVal == 0 || priceVal == 0 || volumeVal == 0) {
                    $(".validationMsg").html('<span class="text-danger">Please enter valid values</span>');
                    validationError = true;

                }
                else if (BigNumber(BigNumber(amountVal).times(priceVal).toFixed(DECIMALS_STABLE)).toFixed(DECIMALS_8) != volumeVal) {
                    $(".validationMsg").html('<span class="text-danger">Please enter valid values</span>');
                    validationError = true;

                }
                //Check MIN Values
                else if (valueMoveCommaRight(amountVal, DECIMALS_TOKEN).isLessThan(minValToken)) {
                    $(".validationMsg").html('<span class="text-danger">Amount is too low</span>');
                    validationError = true;
                }
                else if (valueMoveCommaRight(volumeVal, DECIMALS_STABLE).isLessThan(minValStable)) {
                    $(".validationMsg").html('<span class="text-danger">Volume is too low</span>');
                    validationError = true;
                }
                else {
                    if (isBuy) {
                        if (valueMoveCommaRight(volumeVal, DECIMALS_STABLE).isGreaterThan(balanceStable)) {
                            $(".validationMsg").html('<span class="text-danger">Your ' + NAME_STABLE + ' balance is too low</span>');
                            validationError = true;
                        }
                    }
                    else {
                        if (valueMoveCommaRight(amountVal, DECIMALS_TOKEN).isGreaterThan(balanceToken)) {
                            $(".validationMsg").html('<span class="text-danger">Your ' + NAME_TOKEN + ' balance is too low</span>');
                            validationError = true;
                        }
                    }
                }

                $(".submitBtn").prop("hidden", true)
                $('#buy').prop("disabled", true)
                $('#sell').prop("disabled", true)
                $(".amount").prop("disabled", true)
                $(".price").prop("disabled", true)
                $(".volume").prop("disabled", true)


                if (validationError == false) {//approval

                    if (isBuy) {
                        if (BigNumber(allowanceStable).isLessThan(valueMoveCommaRight(volumeVal, DECIMALS_STABLE))) {
                            [validationError, transactionError] = await sendTransaction(
                                '<span class="fw-bold">Approval (' + NAME_STABLE + ')</span>',
                                function () { return stable.approve(CONTRACT_MARKETPLACE, "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF") },
                                function () { return stable.Approval() },
                                { TRC20_STABLE_APPROVE_OWNER: window.tronWeb.defaultAddress.base58, TRC20_STABLE_APPROVE_SPENDER: CONTRACT_MARKETPLACE, TRC20_STABLE_APPROVE_VALUE: "340282366920938463463374607431768211455" }
                            )
                        }
                    }
                    else { //isSell
                        if (BigNumber(allowanceToken).isLessThan(valueMoveCommaRight(amountVal, DECIMALS_TOKEN))) {
                            [validationError, transactionError] = await sendTransaction(
                                '<span class="fw-bold">Approval (' + NAME_TOKEN + ')</span>',
                                function () { return token.approve(CONTRACT_MARKETPLACE, "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF") },
                                function () { return token.Approval() },
                                { TRC20_TOKEN_APPROVE_OWNER: window.tronWeb.defaultAddress.base58, TRC20_TOKEN_APPROVE_SPENDER: CONTRACT_MARKETPLACE, TRC20_TOKEN_APPROVE_VALUE: "340282366920938463463374607431768211455" }
                            )
                        }
                    }
                }


                if (validationError == false && transactionError == false) {//create offer
                    [validationError, transactionError] = await sendTransaction(
                        '<span class="fw-bold">Create Offer</span>',
                        function () { return marketplace.createOffer(String(valueMoveCommaRight(amountVal, DECIMALS_TOKEN).toFixed(0)), String(valueMoveCommaRight(volumeVal, DECIMALS_STABLE).toFixed(0)), isSell) },
                        function () { return marketplace.CreateOffer() },
                        { "issuer": window.tronWeb.defaultAddress.base58 }
                    )

                }

                if (validationError) {
                    $(".submitBtn").prop("hidden", false)
                    $('#buy').prop("disabled", false)
                    $('#sell').prop("disabled", false)
                    $(".amount").prop("disabled", false)
                    $(".price").prop("disabled", false)
                    $(".volume").prop("disabled", false)
                }
            }, false)
        })


    // MODALS - On Submit Event Listeners (AcceptOfferModal)
    Array.prototype.slice.call(formsAcceptOffer)
        .forEach(function (form) {
            form.addEventListener('submit', async function (event) {
                event.preventDefault()
                event.stopPropagation()

                let amountVal = $(".amount").val();
                let priceVal = $(".price").val();
                let volumeVal = $(".volume").val();
                let isSell = ($("#AcceptOfferModal").attr('data-offer-sell') == "true") ? true : false
                let acceptOfferId = $("#AcceptOfferModal").attr('data-offer-id')
                let acceptOfferMaxAmount = $(".accept-offer-max-amount").text()
                let acceptOfferMaxVolume = $(".accept-offer-max-volume").text()
                let acceptOfferMaxExactVolume = $(".accept-offer-max-volume").attr('data-exact-val-stable')

                let validationError = false;
                let transactionError = false;

                console.log("minValToken = " + minValToken)
                console.log("minValStable = " + minValStable)
                console.log("acceptOfferMaxExactVolume = " + acceptOfferMaxExactVolume)
                console.log("volumeVal = " + valueMoveCommaRight(volumeVal, DECIMALS_STABLE))


                if (amountVal == 0 || priceVal == 0 || volumeVal == 0) {
                    $(".validationMsg").html('<span class="text-danger">Please enter valid values</span>');
                    validationError = true;

                }
                else if (BigNumber(BigNumber(amountVal).times(priceVal).toFixed(DECIMALS_STABLE)).toFixed(DECIMALS_8) != volumeVal) {
                    $(".validationMsg").html('<span class="text-danger">Please enter valid values</span>');
                    validationError = true;

                }
                else if (BigNumber(amountVal).isGreaterThan(acceptOfferMaxAmount)) {
                    $(".validationMsg").html('<span class="text-danger">Amount is too high</span>');
                    validationError = true;
                }
                //Check MIN Values
                else if (valueMoveCommaRight(amountVal, DECIMALS_TOKEN).isLessThan(minValToken)) {
                    $(".validationMsg").html('<span class="text-danger">Amount is too low</span>');
                    validationError = true;
                }
                else if (valueMoveCommaRight(volumeVal, DECIMALS_STABLE).isLessThan(minValStable)) {
                    $(".validationMsg").html('<span class="text-danger">Volume is too low</span>');
                    validationError = true;
                }
                //Check subtracted MIN Values
                else if (BigNumber(acceptOfferMaxAmount).minus(amountVal).isGreaterThan(0)
                    && valueMoveCommaRight(BigNumber(acceptOfferMaxAmount).minus(amountVal), DECIMALS_TOKEN).isLessThan(minValToken)) {
                    $(".validationMsg").html('<span class="text-danger">MaxAmount minus Amount is too low</span>');
                    validationError = true;
                }
                else if (BigNumber(acceptOfferMaxAmount).minus(amountVal).isGreaterThan(0)
                    && BigNumber(acceptOfferMaxExactVolume).minus(valueMoveCommaRight(volumeVal, DECIMALS_STABLE)).isGreaterThan(0)
                    && BigNumber(acceptOfferMaxExactVolume).minus(valueMoveCommaRight(volumeVal, DECIMALS_STABLE)).isLessThan(minValStable)) {
                    $(".validationMsg").html('<span class="text-danger">MaxVolume minus Volume is too low</span>');
                    validationError = true;
                }
                else {
                    if (!isSell) {
                        // TBD check also against min val
                        if (valueMoveCommaRight(volumeVal, DECIMALS_STABLE).isGreaterThan(balanceStable)) {
                            $(".validationMsg").html('<span class="text-danger">Your ' + NAME_STABLE + ' balance is too low</span>');
                            validationError = true;
                        }
                    }
                    else {
                        // TBD check also against min val
                        if (valueMoveCommaRight(amountVal, DECIMALS_TOKEN).isGreaterThan(balanceToken)) {
                            $(".validationMsg").html('<span class="text-danger">Your ' + NAME_TOKEN + ' balance is too low</span>');
                            validationError = true;
                        }
                    }
                }

                $(".submitBtn").prop("hidden", true)
                $(".amount").prop("disabled", true)
                $(".price").prop("disabled", true)
                $(".volume").prop("disabled", true)


                if (validationError == false) {//approval
                    if (!isSell) {
                        if (BigNumber(allowanceStable).isLessThan(valueMoveCommaRight(volumeVal, DECIMALS_STABLE))) {
                            [validationError, transactionError] = await sendTransaction(
                                '<span class="fw-bold">Approval (' + NAME_STABLE + ')</span>',
                                function () { return stable.approve(CONTRACT_MARKETPLACE, "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF") },
                                function () { return stable.Approval() },
                                { TRC20_STABLE_APPROVE_OWNER: window.tronWeb.defaultAddress.base58, TRC20_STABLE_APPROVE_SPENDER: CONTRACT_MARKETPLACE, TRC20_STABLE_APPROVE_VALUE: "340282366920938463463374607431768211455" }
                            )
                        }
                    }
                    else { //isSell
                        if (BigNumber(allowanceToken).isLessThan(valueMoveCommaRight(amountVal, DECIMALS_TOKEN))) {
                            [validationError, transactionError] = await sendTransaction(
                                '<span class="fw-bold">Approval (' + NAME_TOKEN + ')</span>',
                                function () { return token.approve(CONTRACT_MARKETPLACE, "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF") },
                                function () { return token.Approval() },
                                { TRC20_TOKEN_APPROVE_OWNER: window.tronWeb.defaultAddress.base58, TRC20_TOKEN_APPROVE_SPENDER: CONTRACT_MARKETPLACE, TRC20_TOKEN_APPROVE_VALUE: "340282366920938463463374607431768211455" }
                            )
                        }
                    }
                }

                if (validationError == false && transactionError == false) {//accept offer
                    [validationError, transactionError] = await sendTransaction(
                        '<span class="fw-bold">Accept Offer</span>',
                        function () { return marketplace.acceptOffer(acceptOfferId, String(valueMoveCommaRight(amountVal, DECIMALS_TOKEN).toFixed(0))) },
                        function () { return marketplace.AcceptOffer() },
                        { "offerId": acceptOfferId }
                    )
                }

                if (validationError) {
                    $(".submitBtn").prop("hidden", false)
                    $(".amount").prop("disabled", false)
                    $(".price").prop("disabled", true)
                    $(".volume").prop("disabled", false)
                }
            }, false)
        })

    // MODALS - On Submit Event Listeners (CancelOfferModal)
    Array.prototype.slice.call(formsCancelOffer)
        .forEach(function (form) {
            form.addEventListener('submit', async function (event) {
                event.preventDefault()
                event.stopPropagation()

                let isCancel = document.getElementById("cancel").checked;

                let validationError = false;
                let transactionError = false;

                if (!isCancel) {
                    $(".validationMsg").html('<span class="text-danger">Please select Cancel Offer</span>');
                    validationError = true;
                }

                $(".submitBtn").prop("hidden", true)
                $('#cancel').prop("disabled", true)

                if (validationError == false) {
                    [validationError, transactionError] = await sendTransaction(
                        '<span class="fw-bold">Cancel Offer</span>',
                        function () { return marketplace.cancelOffer($('#cancel').prop('value')) },
                        function () { return marketplace.RemoveOffer() },
                        { "offerId": $('#cancel').prop('value') }
                    )
                }

                if (validationError) {
                    $(".submitBtn").prop("hidden", false)
                    $('#cancel').prop("disabled", false)
                }
            }, false)
        })
})