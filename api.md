# Bubblemaps Legacy API - Map Data

*This is a private document that has been shared to you and you only. Please ask us before sharing.*

## Disclaimer

If you're reading this, it's that we've judged that it will be useful to you and that we're okay with you using it. Although, as we've surely already told you, let's insist: this endpoint was not intended for external usage. So, it might be a bit messy, as decribed below.

## Why 'Legacy'?

We're working on a new version of Bubblemaps that will come with a cleaner and more complete API, and we don't want any confusion between the two systems.

But the legacy API is what is currently used on Bubblemaps and it will be maintained as long as this version of Bubblemaps is, which should be quite some time (there will be significant overlap between the old and new Bubblemaps apps).

## Endpoint Description
For already computed maps, you can call this endpoint freely without any key:

```
https://api-legacy.bubblemaps.io/map-data?token=0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95&chain=bsc
```

Just replace the token parameter by the smart contract you want to analyse, and the chain parameter of your choice. For now, available chains are `eth`, `bsc`, `ftm`, `avax`, `cro`, `arbi`, `poly`, `base`, `sol`, and `sonic`.


If you request a non-computed map, you'll get a 401 error. To compute new maps on the fly or refresh maps you'll need an API key, which we can discuss later if you're interested.

The json response might not be very clear to external users, as it was originally designed for our front-end use only. It looks like this :


```json
{
    "version": 4,
    "chain": "bsc",
    "token_address": "0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95",
    "dt_update": "Sun, 08 May 2022 23:58:57 GMT",
    "full_name": "ApeSwapFinance Banana",
    "symbol": "BANANA",
    "is_X721": false,
    "metadata": {
        "max_amount": 48921412.08087653,
        "min_amount": 8218.508019
    },
    "nodes": [
        {
            "address": "0x5c8d727b265dbafaba67e050f2f739caeeb4a6f9",
            "amount": 48921412.08087653,
            "is_contract": true,
            "name": "ApeSwap: MasterApe",
            "percentage": 33.9308,
            "transaction_count": 2000,
            "transfer_X721_count": null,
            "transfer_count": 2000
        },
        {
            "address": "0x000000000000000000000000000000000000dead",
            "amount": 27028750.883714695,
            "is_contract": false,
            "name": "Null Address: 0x000...dEaD",
            "percentage": 18.7465,
            "transaction_count": 2000,
            "transfer_X721_count": 2000,
            "transfer_count": 2000
        },
        {
            "address": "0xec4b9d1fd8a3534e31fce1636c7479bcd29213ae",
            "amount": 14846123.260382293,
            "is_contract": true
            "percentage": 10.2969,
            "transaction_count": 2000,
            "transfer_X721_count": null,
            "transfer_count": 2000
        },
        ...
    ],
    "links": [
        {
            "backward": 609.358,
            "forward": 1651.0449656949636,
            "source": 5,
            "target": 12
        },
        {
            "backward": 514,
            "forward": 0,
            "source": 18,
            "target": 51
        },
        ...
    ],
    "token_links": [
        {
            "address": "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
            "decimals": 18,
            "name": "Binance-Peg BUSD Token",
            "symbol": "BUSD",
            "links": [...]
        },
        {
            "address": "0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95",
            "name": "ApeSwapFinance Banana",
            "symbol": "BANANA",
            "links": [...]
        }
    ]
}
```

- `version` stands for the version of the data schema. The last version is 5, every map refreshed after ~February 2022 (so most of the maps really) should be on version 4 or 5. Older versions schemas are slightly different.
- The other first fields are pretty self explanatory, don’t hesitate if you have any questions.
- `is_X721` is just a flag to differentiate ERC20/BEP20/etc tokens from ERC721/BEP721/etc (NFT collections) ones.
- `max_amount` and `min_amount` describe the token amount max and min value amongst the top 150 holders. This is not used anymore and will probably be deprecated in future versions.
- `nodes` describes the top 150 holders (sometimes 500 when we specifically create bigger maps on our side), this is an ordered list. The order might slightly differ from what you can see on the webapp, because it handles perfect ties differently.
- All the counts values are capped to 2000, `transfer_X721_count` is not computed for non ERC721/BEP721/etc tokens.
- `links` describe all the base (ETH/BNB/etc) links of the bubble map. `source` and `target` are the indexes (in the nodes array, starting at index `0`) of the two linked nodes. `forward` is the amount transfered from the source to the target, and `backward` from the target to the source. Please note that:
    - For a given link the choice of which node is the ‘source’ and the ‘target’ is arbitrary and actually not important (they could be switched as long as the backward and forward values are too)
    - At least one of the forward or backward values is `!= 0`. 
    - Only the last 2k transactions of each node are considered when computing the amounts values
- `token_links` describe the other available ‘modes’. For each, there are a few fields describing the token considered for the mode, and there is  the links object that follows the exact same structure as described above