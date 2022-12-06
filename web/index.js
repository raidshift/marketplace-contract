let NETWORK
let CONTRACT_MARKETPLACE; // OBSOLETE
let CONTRACT_A4B;
let CONTRACT_B4A;
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
let CONTRACT_A4B_NETWORK_URL
let CONTRACT_B4A_NETWORK_URL
let HTML_CONN_BADGE
let HTML_CONN_BADGE_SPINNER
let TRONSCAN_URL_PREFIX
let TRANSACTION_URL
let ALLOWANCE_FIX_TOKEN
let ALLOWANCE_FIX_STABLE
let TRONGRID_URL_PREFIX
let ID_PREFIX_SELL= "S"
let ID_PREFIX_BUY = "B"

const DECIMALS_8 = 8;
const DECIMALS_6 = 6;
const DECIMALS_2 = 2;
const MAX_LIST_ITEMS = 500;

let yourOffers = [];
let sellOffers = [];
let buyOffers = [];

// A4B variables
let rawOffersA4B = []
let rawOffersB4A = []

let priceIdxA4B = []
let priceIdxB4A = []

let issuerIdxA4B = []
let issuerIdxB4A = []

let eventsBlockTimeStampA4B = 0;
let eventsBlockTimeStampB4A = 0;

let updatedIds = []
let updateIssuerIds = []
// end A4B variable

let yourOffersSet = false;
let buySellOffersSet = false;

let marketplace = null; // OBSOLETE

let a4bContract = null;
let b4aContract = null;

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
let TRONWEB_INITIALIZED = false;
let TRONWEB_USER_HEX;
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
        a4bContract = await tronWeb.contract().at(CONTRACT_A4B);
        b4aContract = await tronWeb.contract().at(CONTRACT_B4A);
        TRONWEB_INITIALIZED = true;
        TRONWEB_USER_HEX = window.tronWeb.defaultAddress.hex;
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
            if (!TRONWEB_INITIALIZED) {
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

function sortRawOffersByPrice(isSell) {
    let idx = isSell ? priceIdxA4B : priceIdxB4A;
    let offers = isSell ? rawOffersA4B : rawOffersB4A;

    idx.sort((a, b) => {
        let x = BigNumber(offers[a]["price"])
        let y = BigNumber(offers[b]["price"])

        if (x == 0) return 1;
        if (y == 0) return -1;

        if (x.isLessThan(y)) {
            return isSell ? -1 : 1;
        }
        if (x.isGreaterThan(y)) {
            return isSell ? 1 : -1;
        }
        return 0;
    })
}

async function fetchEventsOnePage(minBlockTimestamp, fingerprint, contract) {
    const options = {
        method: "GET",
        headers: { Accept: "application/json" }
    };

    let fetchURL = `${TRONGRID_URL_PREFIX}/v1/contracts/${contract}/events?limit=200&min_block_timestamp=${minBlockTimestamp}&order_by=block_timestamp,asc&search_internal=false`;

    if (fingerprint) {
        fetchURL += "&fingerprint=" + fingerprint;
    }
    return await fetch(fetchURL, options)
        .then((response) => response.json())
        .then((response) => {
            return response;
        })
        .catch((err) => {
            console.error(err);
        });
}

function logOffer(offer) {
    console.log(`${offer.id}, ${offer.issuer}, ${offer.exactValTOKEN}, ${offer.exactValSTABLE}, ${offer.valTOKEN}, ${offer.valSTABLE}, ${offer.price}, ${offer.sell}`)
}

async function fetchEvents(isSell) {
    let fingerprint = undefined;
    let events = undefined
    let minBlockTimestamp = isSell ? eventsBlockTimeStampA4B : eventsBlockTimeStampB4A;
    let latestBlockTimeStamp = 0;

    let contract = isSell ? CONTRACT_A4B : CONTRACT_B4A;
    let rawOffers = isSell ? rawOffersA4B : rawOffersB4A;
    let priceIdx = isSell ? priceIdxA4B : priceIdxB4A;
    let issuerIdx = isSell ? issuerIdxA4B : issuerIdxB4A;
    let idPrefix = isSell ? ID_PREFIX_SELL : ID_PREFIX_BUY;

    let mustSort = false;

    while (true) {
        events = undefined;
        while (!events) {
            events = await fetchEventsOnePage(minBlockTimestamp, fingerprint, contract);
            await new Promise((r) => setTimeout(r, 100));
        }

        events.data.forEach(event => {
            if (event.event_name == 'UpdateOffer') {
                if (latestBlockTimeStamp < event.block_timestamp) { latestBlockTimeStamp = event.block_timestamp }

                let exactValTOKEN, exactValSTABLE;
                let price = 0;
                if (isSell) {
                    exactValTOKEN = event.result.valA; exactValSTABLE = event.result.valB;
                } else {
                    exactValSTABLE = event.result.valA; exactValTOKEN = event.result.valB;
                }

                if (!BigNumber(exactValTOKEN).isEqualTo(0) && !BigNumber(exactValSTABLE).isEqualTo(0)) {
                    price = BigNumber(exactValSTABLE).div(exactValTOKEN).toFixed(DECIMALS_8);
                }

                let addOffer = (event.result.id >= rawOffers.length) ? true : false;

                if (addOffer || BigNumber(exactValTOKEN).isLessThan(rawOffers[event.result.id].exactValTOKEN) || BigNumber(exactValSTABLE).isLessThan(rawOffers[event.result.id].exactValSTABLE)) {

                    let issuer = "41" + event.result.seller.substr(2).toLowerCase();
                    let id = idPrefix + event.result.id;


                    if (addOffer) { // add offer
                        priceIdx.push(event.result.id)

                        if (yourOffersSet && issuer === TRONWEB_USER_HEX) {
                            issuerIdx.push(event.result.id)
                            updateIssuerIds.push(id);
                        }
                        updatedIds.push(id);
                        mustSort = true;
                    }
                    else { // update offer
                        if (!(price === rawOffers[event.result.id].price)) {
                            updatedIds.push(id);
                            mustSort = true;
                        }
                    }

                    rawOffers[event.result.id] = {
                        "id": id,
                        "issuer": issuer,
                        "exactValTOKEN": exactValTOKEN,
                        "exactValSTABLE": exactValSTABLE,
                        "valTOKEN": valueMoveCommaLeft(exactValTOKEN, DECIMALS_TOKEN).toFixed(DECIMALS_8),
                        "valSTABLE": valueMoveCommaLeft(exactValSTABLE, DECIMALS_STABLE).toFixed(DECIMALS_8),
                        "price": price,
                        "sell": isSell
                    }
                }
            }
        });
        fingerprint = events.meta.fingerprint;

        if (!fingerprint) {
            break;
        }
    }

    if (mustSort) {
        sortRawOffersByPrice(isSell);
    }

    isSell ? eventsBlockTimeStampA4B = latestBlockTimeStamp : eventsBlockTimeStampB4A = latestBlockTimeStamp;
}

function displayOffers() {
    let issuerCnt = 0;
    let sellCnt = 0;
    let buyCnt = 0;

    $(".asks").empty()
    $(".bids").empty()
    $(".myoffers").empty()

    priceIdxA4B.forEach(idx => {
        let offer = rawOffersA4B[idx];
        if (offer.price > 0) {
            $(".asks").append(sellOfferToHTML(offer));
            sellCnt++;
        }
    })
    $(".asksCount").text(`(${sellCnt})`)

    priceIdxB4A.forEach(idx => {
        let offer = rawOffersB4A[idx];
        if (offer.price > 0) {
            $(".bids").append(buyOfferToHTML(offer));
            buyCnt++;
        }
    })
    $(".bidsCount").text(`(${buyCnt})`)

    issuerIdxA4B.forEach(idx => {
        let offer = rawOffersA4B[idx];
        if (offer.price > 0) {
            $(".myoffers").append(yourOfferToHTML(offer));
            $("#buy_btn_active_" + offer.id).prop("hidden", true)
            $("#buy_btn_inactive_" + offer.id).prop("hidden", false)
            $("#sell_btn_active_" + offer.id).prop("hidden", true)
            $("#sell_btn_inactive_" + offer.id).prop("hidden", false)
            issuerCnt++;
        }
    });
    issuerIdxB4A.forEach(idx => {
        let offer = rawOffersB4A[idx];
        if (offer.price > 0) {
            $(".myoffers").append(yourOfferToHTML(offer));
            $("#buy_btn_active_" + offer.id).prop("hidden", true)
            $("#buy_btn_inactive_" + offer.id).prop("hidden", false)
            $("#sell_btn_active_" + offer.id).prop("hidden", true)
            $("#sell_btn_inactive_" + offer.id).prop("hidden", false)
            issuerCnt++;
        }
    });
    $(".myoffersCount").text(`(${issuerCnt})`)

}

function flashOffers() {
    updatedIds.forEach(id => {
        $("#cancel_" + id).removeClass("flash")
        $("#buy_" + id).removeClass("flash")
        $("#sell_" + id).removeClass("flash")
    
        setTimeout(function () {
            $("#cancel_" + id).addClass("flash")
            $("#buy_" + id).addClass("flash")
            $("#sell_" + id).addClass("flash")
        }, 100);
    });
}

async function fetchAndDisplayEvents() {
    updatedIds = [];
    updateIssuerIds = [];

    await fetchEvents(true)
    await fetchEvents(false)


    let forceDisplayOffers = false;

    if (TRONWEB_INITIALIZED && !yourOffersSet) {
        for (let i = 0; i < rawOffersA4B.length; i++) {
            if (rawOffersA4B[i].issuer === TRONWEB_USER_HEX) {
                issuerIdxA4B.push(i);
                updateIssuerIds.push(rawOffersA4B[i].issuer.id)
            }
        }

        for (let i = 0; i < rawOffersB4A.length; i++) {
            if (rawOffersB4A[i].issuer === TRONWEB_USER_HEX) {
                issuerIdxB4A.push(i);
                updateIssuerIds.push(rawOffersB4A[i].issuer.id)
            }
        }

        yourOffersSet = true;
        forceDisplayOffers = true;
    }

    if (updatedIds.length > 0 || updateIssuerIds.length > 0 || forceDisplayOffers) {
        displayOffers();
        flashOffers();
    }
}


async function startEventFeed() {
    try {
        console.log("STARTING EVENT FEED")
        while (true) {
            await fetchAndDisplayEvents()
            await new Promise((r) => setTimeout(r, 1000));
        }
    }
    catch (err) {
        console.log(err)
        // window.location.reload();
    }
}


function yourOfferToHTML(record) {
    let html = '<tr id="cancel_' + record.id + '">'
    // html += '<td>' + record.id + '</td>'
    html += '<td class="text-success"> ' + (record.sell ? 'Sell' : 'Buy') + '</td>'
    html += '<td class="amount_' + record.id + '">' + adjustDecimals(record.valTOKEN) + '</td>'
    html += '<td class="text-success">' + adjustDecimals(record.price) + '</td>'
    html += '<td class="volume_' + record.id + '">' + adjustDecimals(record.valSTABLE) + '</td>'
    html += '<td style="text-align:right"><a href style="text-decoration: none;outline : none;" data-bs-toggle="modal" data-bs-target="#CancelOfferModal" data-bs-id="' + record.id + '" data-bs-sell="' + record.sell + '"><span class="badge rounded-pill bg-success text-dark ">Cancel</span></a></td>'
    html += '</tr>'
    return html
}

function sellOfferToHTML(record) {
    let html = '<tr id="buy_' + record.id + '">'
    html += '<td class="amount_' + record.id + '">' + adjustDecimals(record.valTOKEN) + '</td>'
    html += '<td class="text-success">' + adjustDecimals(record.price) + '</td>'
    html += '<td class="volume_' + record.id + '">' + adjustDecimals(record.valSTABLE) + '</td>'
    html += '<td id="buy_btn_active_' + record.id + '" class="buy_btn_active" style="text-align:right" ' + (yourOffersSet ? '' : 'hidden') + '><a href style="text-decoration: none;outline : none;" data-bs-toggle="modal" data-bs-target="#AcceptOfferModal" data-bs-id="' + record.id + '" data-bs-sell="false"><span class="badge rounded-pill bg-success text-dark">Buy</span></a></td>'
    html += '<td id="buy_btn_inactive_' + record.id + '" class="buy_btn_inactive" style="text-align:right" ' + (yourOffersSet ? 'hidden' : '') + '><span class="badge rounded-pill bg-secondary text-dark">Buy</span></td>'
    html += '</tr>'
    return html;

}

function buyOfferToHTML(record) {
    let html = '<tr id="sell_' + record.id + '">'
    html += '<td class="amount_' + record.id + '">' + adjustDecimals(record.valTOKEN) + '</td>'
    html += '<td class="text-success">' + adjustDecimals(record.price) + '</td>'
    html += '<td class="volume_' + record.id + '">' + adjustDecimals(record.valSTABLE) + '</td>'
    html += '<td id="sell_btn_active_' + record.id + '" class="sell_btn_active" style="text-align:right" ' + (yourOffersSet ? '' : 'hidden') + '><a href style="text-decoration: none;outline : none;" data-bs-toggle="modal"  data-bs-target="#AcceptOfferModal" data-bs-id="' + record.id + '" data-bs-sell="true"><span class="badge rounded-pill bg-success text-dark">Sell</span></a></td>'
    html += '<td id="sell_btn_inactive_' + record.id + '" class="sell_btn_inactive" style="text-align:right" ' + (yourOffersSet ? 'hidden' : '') + '><span class="badge rounded-pill bg-secondary text-dark">Sell</span></td>'
    html += '</tr>'
    return html;

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

    let isSell = (event.relatedTarget.getAttribute('data-bs-sell') == "true") ? true : false

    $("#CancelOfferModal").attr('data-offer-sell', isSell)

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
        pair = "jst_usdj_nile"
    }

    switch (pair) {
        case "jst_usdj_nile":
            NETWORK = "Nile Testnet";

            CONTRACT_MARKETPLACE = "TQAymA8RuqWRpYrrKsYfh45H71h7WiY5G8";

            CONTRACT_A4B = "TEZRaiqKSsNcLNTxQjLvKLejpRy6g64p9Q"
            CONTRACT_B4A = "TBkMMFuujZHPyYsnfCJ5BPdk1uP5hP1DcC"

            CONTRACT_TOKEN = "TF17BgPaZYbz8oxbjhriubPDsA7ArKoLX3";
            CONTRACT_STABLE = "TLBaRhANQoJFTqre9Nf1mjuwNWjCJeYqUL";
            NAME_TOKEN = "JST"
            NAME_STABLE = "USDJ"
            IMG_TOKEN = "jst.svg"
            TRC20_TOKEN_APPROVE_OWNER = "src"
            TRC20_TOKEN_APPROVE_SPENDER = "guy"
            TRC20_TOKEN_APPROVE_VALUE = "wad"
            TRC20_STABLE_APPROVE_OWNER = "src"
            TRC20_STABLE_APPROVE_SPENDER = "guy"
            TRC20_STABLE_APPROVE_VALUE = "wad"
            DECIMALS_TOKEN = 18;
            DECIMALS_STABLE = 18;
            FEED_TOKEN = "just";
            FEED_STABLE = "just-stablecoin";
            TRONSCAN_URL_PREFIX = "https://nile.tronscan.org";
            ALLOWANCE_FIX_TOKEN = false;
            ALLOWANCE_FIX_STABLE = false;
            TRONGRID_URL_PREFIX = "https://nile.trongrid.io"
            break;
        case "btc_usdt":
            NETWORK = "Mainnet"
            CONTRACT_MARKETPLACE = "TFr8j8M9dTZi4TvGbxZdNR7bfYbzVScYmk";
            CONTRACT_TOKEN = "TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9";
            CONTRACT_STABLE = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
            NAME_TOKEN = "BTC"
            NAME_STABLE = "USDT"
            IMG_TOKEN = "btc.svg"
            TRC20_TOKEN_APPROVE_OWNER = "owner"
            TRC20_TOKEN_APPROVE_SPENDER = "spender"
            TRC20_TOKEN_APPROVE_VALUE = "value"
            TRC20_STABLE_APPROVE_OWNER = "owner"
            TRC20_STABLE_APPROVE_SPENDER = "spender"
            TRC20_STABLE_APPROVE_VALUE = "value"
            DECIMALS_TOKEN = 8;
            DECIMALS_STABLE = 6;
            FEED_TOKEN = "bitcoin";
            FEED_STABLE = "tether";
            TRONSCAN_URL_PREFIX = "https://tronscan.io";
            ALLOWANCE_FIX_TOKEN = false;
            ALLOWANCE_FIX_STABLE = false;
            TRONGRID_URL_PREFIX = "https://api.trongrid.io"
            break;
        case "eth_usdt":
            NETWORK = "Mainnet";
            CONTRACT_MARKETPLACE = "TUhtf9TRBN26KWN5K9fXVc2HywZbL91J2X";
            CONTRACT_TOKEN = "THb4CqiFdwNHsWsQCs4JhzwjMWys4aqCbF";
            CONTRACT_STABLE = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
            NAME_TOKEN = "ETH"
            NAME_STABLE = "USDT"
            IMG_TOKEN = "eth.png"
            TRC20_TOKEN_APPROVE_OWNER = "owner"
            TRC20_TOKEN_APPROVE_SPENDER = "spender"
            TRC20_TOKEN_APPROVE_VALUE = "value"
            TRC20_STABLE_APPROVE_OWNER = "owner"
            TRC20_STABLE_APPROVE_SPENDER = "spender"
            TRC20_STABLE_APPROVE_VALUE = "value"
            DECIMALS_TOKEN = 18;
            DECIMALS_STABLE = 6;
            FEED_TOKEN = "ethereum";
            FEED_STABLE = "tether";
            TRONSCAN_URL_PREFIX = "https://tronscan.io";
            ALLOWANCE_FIX_TOKEN = false;
            ALLOWANCE_FIX_STABLE = false;
            TRONGRID_URL_PREFIX = "https://api.trongrid.io"
            break;
        case "ltc_usdt":
            NETWORK = "Mainnet";
            CONTRACT_MARKETPLACE = "TXQzQaA9ooyWqFbYdti77puGejBV8kzpx8";
            CONTRACT_TOKEN = "TR3DLthpnDdCGabhVDbD3VMsiJoCXY3bZd";
            CONTRACT_STABLE = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
            NAME_TOKEN = "LTC"
            NAME_STABLE = "USDT"
            IMG_TOKEN = "ltc.svg"
            TRC20_TOKEN_APPROVE_OWNER = "owner"
            TRC20_TOKEN_APPROVE_SPENDER = "spender"
            TRC20_TOKEN_APPROVE_VALUE = "value"
            TRC20_STABLE_APPROVE_OWNER = "owner"
            TRC20_STABLE_APPROVE_SPENDER = "spender"
            TRC20_STABLE_APPROVE_VALUE = "value"
            DECIMALS_TOKEN = 8;
            DECIMALS_STABLE = 6;
            FEED_TOKEN = "litecoin";
            FEED_STABLE = "tether";
            TRONSCAN_URL_PREFIX = "https://tronscan.io";
            ALLOWANCE_FIX_TOKEN = false;
            ALLOWANCE_FIX_STABLE = false;
            TRONGRID_URL_PREFIX = "https://api.trongrid.io"
            break;
        case "doge_usdt":
            NETWORK = "Mainnet";
            CONTRACT_MARKETPLACE = "TV2hkq3aRKgRWadPXPVmGqHGzHew58nSUs";
            CONTRACT_TOKEN = "THbVQp8kMjStKNnf2iCY6NEzThKMK5aBHg";
            CONTRACT_STABLE = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
            NAME_TOKEN = "DOGE"
            NAME_STABLE = "USDT"
            IMG_TOKEN = "doge.svg"
            TRC20_TOKEN_APPROVE_OWNER = "owner"
            TRC20_TOKEN_APPROVE_SPENDER = "spender"
            TRC20_TOKEN_APPROVE_VALUE = "value"
            TRC20_STABLE_APPROVE_OWNER = "owner"
            TRC20_STABLE_APPROVE_SPENDER = "spender"
            TRC20_STABLE_APPROVE_VALUE = "value"
            DECIMALS_TOKEN = 8;
            DECIMALS_STABLE = 6;
            FEED_TOKEN = "dogecoin";
            FEED_STABLE = "tether";
            TRONSCAN_URL_PREFIX = "https://tronscan.io";
            ALLOWANCE_FIX_TOKEN = false;
            ALLOWANCE_FIX_STABLE = false;
            TRONGRID_URL_PREFIX = "https://api.trongrid.io"
    }

    if (NETWORK) {
        FEED_URL = "https://api.coingecko.com/api/v3/simple/price?ids=" + FEED_TOKEN + "," + FEED_STABLE + "&vs_currencies=usd";
        CONTRACT_A4B_NETWORK_URL = TRONSCAN_URL_PREFIX + "/#/contract/" + CONTRACT_A4B + "/code"
        CONTRACT_B4A_NETWORK_URL = TRONSCAN_URL_PREFIX + "/#/contract/" + CONTRACT_B4A + "/code"

        let networkSuffix = "";
        if (NETWORK == "Nile Testnet") {
            networkSuffix = `<span style="font-size:x-small">&nbsp;(Test)</span>`;
        }
        HTML_CONN_BADGE = `<img src="${IMG_TOKEN}" height="24px" width="24px" />&nbsp;&nbsp;${NAME_TOKEN}/${NAME_STABLE}${networkSuffix}</div>`;

        TRANSACTION_URL = TRONSCAN_URL_PREFIX + "/#/transaction/";

        $("#conn_badge").html(HTML_CONN_BADGE);
        $(".contractA4BCodeURL").prop("href", CONTRACT_A4B_NETWORK_URL)
        $(".contractB4ACodeURL").prop("href", CONTRACT_B4A_NETWORK_URL)
        $(".tokenName").text(NAME_TOKEN)
        $(".stableName").text(NAME_STABLE)
        $(".stablePerTokenName").text(NAME_STABLE + "/" + NAME_TOKEN)
        $("#FooterContractA4B").prop("hidden", false)
        $("#FooterContractB4A").prop("hidden", false)
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

                let contract = isSell ? a4bContract : b4aContract;
                let CONTRACT_ADDRESS= isSell ? CONTRACT_A4B : CONTRACT_B4A;

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

                let contract = ($("#CancelOfferModal").attr('data-offer-sell') == "true") ? a4bContract : b4aContract;

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
                        function () { return contract.cancelOffer($('#cancel').prop('value').substr(1)) },
                        function () { return contract.UpdateOffer() },
                        { "id": $('#cancel').prop('value').substr(1) } //// TBD TBD TBD!!!

                        UpdateOffer(id,seller,valA,valB)

                    )
                }

                if (validationError) {
                    $(".submitBtn").prop("hidden", false)
                    $('#cancel').prop("disabled", false)
                }
            }, false)
        })
})