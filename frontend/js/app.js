let accounts;

// METAMASK CONNECTION
window.addEventListener("DOMContentLoaded", async () => {

  //// MOBILE MODAL NOTIFICATION
  setTimeout(() => {
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
      modal(document.getElementById("modalMobile"));
    }
  }, 5000);

  const welcomeH1    = document.getElementById("welcomeH1");
  const welcomeH2    = document.getElementById("welcomeH2");
  const welcomeP     = document.getElementById("welcomeP");

  const noMetamask   = document.getElementById("noMetamask");
  const noMetamaskH1 = document.getElementById("noMetamaskH1");
  const noMetamaskH2 = document.getElementById("noMetamaskH2");

  // Mint Modal Trigger
  const mintTrigger = document.querySelectorAll(".mintTrigger"); // this element contains more than 1 DOMs.
  for(var i =0; i < mintTrigger.length; i++) {
    mintTrigger[i].onclick = function() {modal(document.getElementById("modalMint"))};
  }

  welcomeH1.innerText = welcome_h1;
  welcomeH2.innerText = welcome_h2;
  welcomeP.innerHTML  = welcome_p;

  if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
    checkChain();
  } else if (window.web3) {
    window.web3 = new Web3(window.web3.currentProvider);
  }

  if (window.web3) {
    // Check if User is already connected by retrieving the accounts
    await window.web3.eth.getAccounts().then(async (addr) => {
      accounts = addr;
    });
  }

  const splide = new Splide(".splide", {
    type: "loop",
    arrows: false,
    perMove: 3,
    pagination: false,
    autoplay: true,
    direction: 'ttb',
    height: "100%", // "calc(100vh - 90px)",
    width: "320px",
    autoHeight: true,
  });
  splide.mount();

  updateConnectStatus();
  if (MetaMaskOnboarding.isMetaMaskInstalled()) {
    window.ethereum.on("accountsChanged", (newAccounts) => {
      accounts = newAccounts;
      updateConnectStatus();
    });
  }
});

//// MODAL JS
async function modal(modal) {
  // Get the <span> element that closes the modal
  var close = modal.getElementsByClassName("close")[0];
  modal.style.display = "block";
  // When the user clicks on <span> (x), close the modal
  close.onclick = function() {
    modal.style.display = "none";
  }
  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
}

const updateConnectStatus = async () => {
  const onboarding    = new MetaMaskOnboarding();
  const onboardButton = document.getElementById("connectWallet");
  if (!MetaMaskOnboarding.isMetaMaskInstalled()) {
    //// METAMASK NOT INSTALLED
    onboardButton.innerText    = "Install MetaMask";
    onboardButton.onclick = () => {
      onboardButton.innerText  = "Connecting...";
      onboardButton.disabled   = true;
      onboarding.startOnboarding();
    };
    noMetamask.classList.remove('hidden');
    noMetamaskH2.innerHTML  = "<i class='fa-solid fa-unlock'></i> Install MetaMask to Unlock Full Access";
  } else if (accounts && accounts.length > 0) {
    //// CONNECTED TO METAMASK
    onboardButton.innerHTML = "<i class='fa-solid fa-plug'></i> Connected"; // `✔ ...${accounts[0].slice(-4)}`;
    onboardButton.classList.add('active');
    window.address = accounts[0];
    onboardButton.disabled  = true;
    onboarding.stopOnboarding();
    window.contract = new web3.eth.Contract(abi, contractAddress);
    noMetamask.classList.add('hidden');
    loadInfo();
  } else {
    //// CONNECT TO METAMASK
    onboardButton.innerText = "Connect MetaMask";
    noMetamask.classList.remove('hidden');
    noMetamaskH2.innerHTML  = "<i class='fa-solid fa-unlock'></i> Connect MetaMask to Unlock Full Access";
    onboardButton.onclick = async () => {
      await window.ethereum
        .request({
          method: "eth_requestAccounts",
        })
        .then(function (accts) {
          onboardButton.innerHTML = "<i class='fa-solid fa-plug'></i> Connected"; // `✔ ...${accts[0].slice(-4)}`;
          onboardButton.classList.add('active');
          onboardButton.disabled = true;
          window.address = accts[0];
          accounts = accts;
          window.contract = new web3.eth.Contract(abi, contractAddress);
          location.reload();
          noMetamask.classList.add('hidden');
          loadInfo();
        });
    };
  }
};

async function checkChain() {
  let chainId = 0;
  if(chain === 'rinkeby') {
    chainId = 4;
  } else if(chain === 'polygon') {
    chainId = 137;
  } else if(chain === 'ethereum') {
    chainId = 1;
  }
  if (window.ethereum.networkVersion !== chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: web3.utils.toHex(chainId) }],
      });
      updateConnectStatus();
    } catch (err) {
        // This Error Code Indicates that the Chain Has Not Been Added to MetaMask.
      if (err.code === 4902) {
        try {
          if(chain === 'rinkeby') {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainName: 'Rinkeby Test Network',
                  chainId: web3.utils.toHex(chainId),
                  nativeCurrency: { name: 'ETH', decimals: 18, symbol: 'ETH' },
                  rpcUrls: ['https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
                },
              ],
            });
          } else if(chain === 'polygon') {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainName: 'Polygon Mainnet',
                  chainId: web3.utils.toHex(chainId),
                  nativeCurrency: { name: 'MATIC', decimals: 18, symbol: 'MATIC' },
                  rpcUrls: ['https://polygon-rpc.com/'],
                },
              ],
            });
          }
          updateConnectStatus();
        } catch (err) {
          console.log(err);
        }
      }
    }
  }
}

async function loadInfo() {
  window.info             = await window.contract.methods.getInfo().call();
  const publicMintActive  = await contract.methods.mintingActive().call();
  const presaleMintActive = await contract.methods.presaleActive().call();

  const mintActions       = document.getElementById("mintActions");
  const mintCollection    = document.getElementById("mintCollection");
  const mintContainer     = document.getElementById("mintContainer");
  const mintButton        = document.getElementById("mintButton");

  let startTime = "";
  if (publicMintActive) {
    //// PUBLIC ACTIVE

    // console.log("Sale Active!");

    mintButton.innerText  = button_public_mint;
    mintActions.classList.remove('hidden');
    mintCollection.classList.remove('hidden');
    mintContainer.classList.remove('hidden');
    setTotalPrice();
  }
  else {
    //// NOT ACTIVE

    // console.log("Sale Not Active Yet...");

    startTime = window.info.runtimeConfig.publicMintStart;
  }

  const clockdiv = document.getElementById("countdown");
  clockdiv.setAttribute("data-date", startTime);
  countdown();

  //// SHOW CARD
  const countdownCard = document.querySelector('.countdown');
  countdownCard.classList.add('show-card');

  let priceType = '';
  if(chain === 'rinkeby' || chain === 'ethereum') {
    priceType = 'ETH';
  } else if (chain === 'polygon') {
    priceType = 'MATIC';
  }

  // const price        = web3.utils.fromWei(info.deploymentConfig.mintPrice, 'ether');
  const price        = web3.utils.fromWei(info.runtimeConfig.publicMintPrice, 'ether');
  const pricePerMint = document.getElementById("pricePerMint");
  const maxPerMint   = document.getElementById("maxPerMint");
  const totalSupply  = document.getElementById("totalSupply");
  const mintInput    = document.getElementById("mintInput");

  pricePerMint.innerText = `${price} ${priceType}`;
  maxPerMint.innerText   = `${info.deploymentConfig.tokensPerMint}`;
  totalSupply.innerText  = `${info.deploymentConfig.maxSupply}`;
  mintInput.setAttribute("max", info.deploymentConfig.tokensPerMint);

  // MINT INPUT
  const mintIncrement = document.getElementById("mintIncrement");
  const mintDecrement = document.getElementById("mintDecrement");
  const setQtyMax     = document.getElementById("setQtyMax");
  const min           = mintInput.attributes.min.value || false;
  const max           = mintInput.attributes.max.value || false;
  mintDecrement.onclick = () => {
    let value = parseInt(mintInput.value) - 1 || 1;
    if(!min || value >= min) {
      mintInput.value = value;
      setTotalPrice()
    }
  };
  mintIncrement.onclick = () => {
    let value = parseInt(mintInput.value) + 1 || 1;
    if(!max || value <= max) {
      mintInput.value = value;
      setTotalPrice()
    }
  };
  setQtyMax.onclick  = () => {
    mintInput.value = max;
    setTotalPrice()
  };
  mintInput.onchange = () => {
    setTotalPrice()
  };
  mintInput.onkeyup  = async (e) => {
    if (e.keyCode === 13) {
      mint();
    }
  };
  mintButton.onclick = mint;
}

function setTotalPrice() {

  const mintInput      = document.getElementById("mintInput");
  const mintInputValue = parseInt(mintInput.value);
  const totalPrice    = document.getElementById("totalPrice");
  const mintButton    = document.getElementById("mintButton");
  if(mintInputValue < 1 || mintInputValue > info.deploymentConfig.tokensPerMint) {
    totalPrice.innerText = 'INVALID QUANTITY';
    mintButton.disabled  = true;
    mintInput.disabled   = true;
    return;
  }
  // const totalPriceWei = BigInt(info.deploymentConfig.mintPrice) * BigInt(mintInputValue);
  const totalPriceWei = BigInt(info.runtimeConfig.publicMintPrice) * BigInt(mintInputValue);

  let priceType = '';
  if(chain === 'rinkeby' || chain === 'ethereum') {
    priceType = 'ETH';
  } else if (chain === 'polygon') {
    priceType = 'MATIC';
  }

  const price          = web3.utils.fromWei(totalPriceWei.toString(), 'ether');
  totalPrice.innerText = `${price} ${priceType}`;
  mintButton.disabled  = false;
  mintInput.disabled   = false;
}

async function mint() {

  const mintButton     = document.getElementById("mintButton");
  mintButton.disabled  = true;
  // const spinner        = "<div class='dot-elastic'></div><span>Waiting for transaction...</span>";
  const spinner        = "<span>Waiting for transaction...</span>";
  mintButton.innerHTML = spinner;

  const amount = parseInt(document.getElementById("mintInput").value);
  // const value = BigInt(info.deploymentConfig.mintPrice) * BigInt(amount);
  const value = BigInt(info.runtimeConfig.publicMintPrice) * BigInt(amount);
  const publicMintActive  = await contract.methods.mintingActive().call();
  const presaleMintActive = await contract.methods.presaleActive().call();

  if (publicMintActive) {
    // PUBLIC MINT
    try {

      const mintTransaction = await contract.methods
        .mint(amount)
        .send({ from: window.address, value: value.toString() });

      if (mintTransaction) {

        console.log("Minted Successfully!", `Transaction Hash: ${mintTransaction.transactionHash}`);

        if (chain === 'rinkeby') {
          const url = `https://rinkeby.etherscan.io/tx/${mintTransaction.transactionHash}`;
          const mintedContainer    = document.querySelector('.minted-container');
          const countdownContainer = document.querySelector('.countdown');
          const mintedTxnBtn       = document.getElementById("mintedTxnBtn");
          mintedTxnBtn.href        = url;
          countdownContainer.classList.add('hidden');
          mintedContainer.classList.remove('hidden');
        }
      } else {

        console.log("Failed to Mint.");

        document.getElementById("mintContainer").parentElement.firstChild.innerHTML = "Failed to Mint NFT";
        document.getElementById("mintContainer").innterHTML = "<a class='hero-btn btn mint-btn primaryBtn' onclick='window.location.reload();'><span>Reload Page</span></a>";
      }

    } catch(e) {

      // console.log(e);

      window.location.reload();

      document.getElementById("mintContainer").parentElement.firstChild.innerHTML = "Failed to Mint NFT";
      document.getElementById("mintContainer").innterHTML = "<a class='hero-btn btn mint-btn primaryBtn' onclick='window.location.reload();'><span>Reload Page</span></a>";

      // const mainText       = document.getElementById("mainText");
      // mainText.innerText   = mint_failed;
      // mintButton.innerText = button_public_mint;
      // mintButton.disabled  = false;
    }
  }
}
