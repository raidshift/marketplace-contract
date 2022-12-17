// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

interface IERC20_SLIM {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract USDT4RSF {
    address public tokenA = 0xEa51342dAbbb928aE1e576bd39eFf8aaf070A8c6;
    address public tokenB = 0xBbd11A20a4fAD0926467cbB469584EfD53F09FBA;

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
        IERC20_SLIM(tokenA).transferFrom(msg.sender, address(this), valA);
    }

    function acceptOffer(uint256 id, uint256 valB) external {
        Offer memory offer = offers[id];
        uint256 valA;
        if (valB < offer.valB) {
            valA = (offer.valA * valB) / offer.valB;
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
        IERC20_SLIM(tokenB).transferFrom(msg.sender, offer.seller, valB);
        IERC20_SLIM(tokenA).transfer(msg.sender, valA);
    }

     function cancelOffer(uint256 id) external {
        Offer memory offer = offers[id];
        require(msg.sender == offer.seller);
        uint256 valA = offer.valA;
        offer.valA = 0;
        offer.valB = 0;
        offers[id] = offer;
        emit UpdateOffer(id, offer.seller, offer.valA, offer.valB);
        IERC20_SLIM(tokenA).transfer(offer.seller, valA);
    }
}
