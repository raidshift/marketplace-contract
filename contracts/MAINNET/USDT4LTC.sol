// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract USDT4LTC {
    address public tokenA = 0xa614f803B6FD780986A42c78Ec9c7f77e6DeD13C;
    address public tokenB = 0xa54Bd6077B2eb012d92D9563Ff15d2199D8123DE;

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
        IERC20(tokenB).transferFrom(msg.sender, offer.seller, valB);
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