// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract USDT4TRX {
    address public tokenA = 0xEa51342dAbbb928aE1e576bd39eFf8aaf070A8c6;

    struct Offer {
        address seller;
        uint256 valA;
        uint256 valB;
    }
    Offer[] public offers;

    event UpdateOffer(uint256 id, address seller, uint256 valA, uint256 valB);

    function createOffer(uint256 valA, uint256 valB) external returns (uint256 id) {
        require(valA > 0 && valB > 0);
        Offer memory offer;
        offer.seller = msg.sender;
        offer.valA = valA;
        offer.valB = valB;
        id = offers.length;
        offers.push(offer);
        emit UpdateOffer(id, offer.seller, offer.valA, offer.valB);
        IERC20(tokenA).transferFrom(msg.sender, address(this), valA);
    }

    function acceptOffer(uint256 id) external payable {
        Offer memory offer = offers[id];
        uint256 valA;
        uint256 valB;
        if (msg.value < offer.valB) {
            valA = (offer.valA * msg.value) / offer.valB;
            valB = (((offer.valB * valA) - 1) / offer.valA) + 1;
        } else {
            valA = offer.valA;
            valB = offer.valB;
        }
        require(valA > 0);
        offer.valA -= valA;
        offer.valB -= valB;
        offers[id] = offer;
        emit UpdateOffer(id, offer.seller, offer.valA, offer.valB);
        (bool sent, ) = offer.seller.call{value: valB}("");
        require(sent);
        (bool sentChange, ) = msg.sender.call{value: msg.value - valB}("");
        require(sentChange);
        IERC20(tokenA).transfer(msg.sender, valA);
    }

    function cancelOffer(uint256 id) external {
        Offer memory offer = offers[id];
        require(msg.sender == offer.seller);
        uint256 valA = offer.valA;
        offer.valA = 0;
        offer.valB = 0;
        offers[id] = offer;
        emit UpdateOffer(id, offer.seller, offer.valA, offer.valB);
        IERC20(tokenA).transfer(offer.seller, valA);
    }
}