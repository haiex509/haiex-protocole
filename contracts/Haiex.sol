// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC20Stable.sol";

contract Router {

  function swapExactTokensForTokens(
    uint amountIn,
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
  ) external returns (uint[] memory amounts)  {}

  function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts){}

  function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts){}
  
  function WETH() external pure returns (address){}
}

interface ILendingPool {
  function deposit(
    address asset,
    uint256 amount,
    address onBehalfOf,
    uint16 referralCode
  ) external;

  function withdraw(
    address asset,
    uint256 amount,
    address to
  ) external returns (uint256);

  function borrow(
    address asset,
    uint256 amount,
    uint256 interestRateMode,
    uint16 referralCode,
    address onBehalfOf
  ) external;

  function repay(
    address asset,
    uint256 amount,
    uint256 rateMode,
    address onBehalfOf
  ) external returns (uint256);
}

contract Haiex is Pausable, Ownable {

    Router        private  router;
    ILendingPool  private  lendingPool;


    address private  WETH;
    ERC20   public USDToken ;
    ERC20   public AUSDToken ;


    struct Stable {
        ERC20Stable   tokenAddress;
        uint          price;
        uint256       tokenReserve;
        bool          tradable;
    }

    struct FeesOwners {
        address   owner;
        uint      percent;
    }
    

    enum Operation {
        ADD,
        SUB
    }

    Stable[]     public stables;
    FeesOwners[] public feesOwners;


    uint256 public  fees; 
    uint256 public  tradeFees; 
    mapping(address => uint) public feesPartition;

    address public  manager;
    
    uint priceFloatDigit = 100;

    mapping(address => bool) public taxesFreeHolder;

    mapping(address => bool) public senderInProcess;

 
    constructor()   { 
     
        manager = owner();
        fees =  100;        //=> 100/100    = 1%
        tradeFees = 100;    //=> 100/100    = 1%
        taxesFreeHolder[owner()] = true;

        router = Router(0xE43e60736b1cb4a75ad25240E2f9a62Bff65c0C0);
        lendingPool = ILendingPool(0xE43e60736b1cb4a75ad25240E2f9a62Bff65c0C0);

    }  



    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
 
    modifier onlyManager() {
        require(msg.sender == manager, "unauthorized: not manager");
        _;
    }

    modifier onlyManagerOrOwner() {
        require(msg.sender == manager||msg.sender == owner(), "unauthorized: not owner or manager");
        _;
    }


    function changeManager(address manager_) public onlyOwner returns (bool) {
        require(manager_ != address(0) , "Manager can't be null");
        manager = manager_;
        return true;
    }

    function changeRouter(address routerAddr) public onlyManagerOrOwner returns (bool) {
        router = Router(routerAddr);
        return true;
    }

     function changeLendingPool(address lendingPool_) public onlyManagerOrOwner returns (bool) {
        lendingPool = ILendingPool(lendingPool_);
        return true;
    }


    function changeWETH(address wethAddr) public onlyManagerOrOwner returns (bool) {
        WETH = wethAddr;
        return true;
    }

    function changeUSD(address usdToken) public onlyManagerOrOwner returns (bool) {
        require(usdToken != address(0), "Stable1 doest not exist");
        USDToken = ERC20(usdToken);
        return true;
    }

    function changeAUSD(address ausdToken) public onlyManagerOrOwner returns (bool) {
        require(ausdToken != address(0), "Stable1 doest not exist");
        AUSDToken = ERC20(ausdToken);
        return true;
    }

    function changeFee(uint256 fee_) public onlyManagerOrOwner returns (bool) {
        require(fee_ >= 0 , "Cannot be less than zero");
        fees = fee_;
        return true;
    }


   

    function addFeeOwner(address beneficiary, uint amount) public onlyOwner returns (bool) {
        require(beneficiary != address(0), "Beneficiary cannot be null");
        require(amount >= 0 , "Cannot be less than zero");

        uint totalFee = 0;
        for (uint256 index = 0; index < feesOwners.length; index++) {
            totalFee =add(totalFee, feesOwners[index].percent);
        }

        require(add(totalFee, amount)<=100 , "Cannot be more than 100%");

        FeesOwners memory fOwner = FeesOwners({owner:beneficiary, percent: amount});
        feesOwners.push(fOwner);

        return true;
    }

    function removeFeeOwner(address addr) onlyOwner public returns (uint) {
        uint feesOwnersLength = feesOwners.length;

        FeesOwners memory fOwner;

        for(uint i;  i < feesOwnersLength ; i++ )
        {
            if(feesOwners[i].owner == addr){

                fOwner = feesOwners[feesOwnersLength-1];
                feesOwners[feesOwnersLength-1] = feesOwners[i];
                feesOwners[i] = fOwner;
                feesOwners.pop();

                return feesOwners.length;
            }
        }

        return feesOwners.length;

    }

    function feeOwnerLength()  view internal returns(uint) {
      return  feesOwners.length;
    }

    function addTaxesFreeHolder(address holder) public onlyOwner {
        taxesFreeHolder[holder] = true;
    }

    function removeTaxesFreeHolder(address holder) public onlyOwner {
        taxesFreeHolder[holder] = false;
    }


    // =====================================================================================================

    // =================================================Stables Coin Management====================================================



    function addStable(ERC20Stable _tokenAddress, uint _priceInit, uint256  _tokenReserve, bool _tradable ) onlyOwner public returns (bool) {

        uint stablesLength = stables.length;

        Stable memory stable = Stable({tokenAddress:_tokenAddress, price:_priceInit, tokenReserve: _tokenReserve, tradable: _tradable });

        stables.push(stable);

        if(stables.length > stablesLength)
            return true;
    
        return false;
    }

    function removeStableByAddress(ERC20Stable addr) onlyOwner public returns (uint) {
        uint stablesLength = stables.length;
        Stable memory stable;

        for(uint i;  i < stablesLength ; i++ )
        {
            if(stables[i].tokenAddress == addr){

                stable = stables[stablesLength-1];
                stables[stablesLength-1] = stables[i];
                stables[i] = stable;
                stables.pop();

                return stables.length;
            }
                
        }

        return stables.length;

    }

    function getStableByAddress(ERC20Stable addr) public view returns ( Stable memory) {

        Stable memory stable;

        for(uint i;  i < stables.length; i++ )
        {
            if(stables[i].tokenAddress == addr){
                stable = stables[i];
                return (stable);
            }
                
        }

      return stable; 

    }

    function updateStableByAddress(ERC20Stable _tokenAddress, uint _price, uint256  _tokenReserve, bool _tradable) onlyOwner public returns (bool)  {

    
        Stable memory stable;  

        stable.tokenAddress = _tokenAddress;
        stable.price = _price;
        stable.tokenReserve = _tokenReserve;
        stable.tradable = _tradable;

        for(uint i;  i < stables.length; i++ )
        {
            if(stables[i].tokenAddress == _tokenAddress){
                 stables[i] = stable;
                return true;
            }  
        }

        return false;

    }

    function updateStablePrice(ERC20Stable _tokenAddress, uint _price) public onlyManagerOrOwner returns (bool) {
       
        require(_price > 0, "Price must be > 0");
      

        for(uint i;  i < stables.length; i++ )
        {
            if(stables[i].tokenAddress == _tokenAddress){

                 stables[i].price = _price;
              
                return true;
            }  
        }

        return false;
    }

    function updateStableReserve(ERC20Stable _tokenAddress, uint  _amount, Operation  operat) internal  returns (bool)   {


        for(uint i;  i < stables.length; i++ )
        {
            if(stables[i].tokenAddress == _tokenAddress){
                if(operat == Operation.ADD)
                 stables[i].tokenReserve = add(stables[i].tokenReserve, _amount);
                else
                 stables[i].tokenReserve = sub(stables[i].tokenReserve, _amount);

                return true;
            }  
        }

        return false;

    }


    // =====================================================================================================

    // =================================================Stables Converter===================================

    function stableTrade(address _stable1, address _stable2, uint256 amount) public  whenNotPaused returns (bool) {


        //Initialize ERC20 token
        ERC20Stable stableCoin1 = ERC20Stable(_stable1);
        ERC20Stable stableCoin2 = ERC20Stable(_stable2);

        //Get stable information
        Stable memory stable1 = getStableByAddress(stableCoin1);
        Stable memory stable2 = getStableByAddress(stableCoin2);



        //Get sender balance
        uint senderBalance = stableCoin1.balanceOf(msg.sender);
        

        //Check amount, Balance, allowance, token price, existence
        require(_stable1 != address(0), "Stable1 doest not exist");
        require(_stable2 != address(0), "Stable2 doest not exist");
        require(amount > 0, "Amount can't be zero");
        require(senderBalance >= amount, "Token not enough");
        require(stableCoin1.allowance(msg.sender, address(this)) >= amount, "Allowance not enough");
        require(stable1.price > 0, "Stable1 Price has not been define");
        require(stable2.price > 0, "Stable2 Price has not been define");
        require(senderInProcess[msg.sender] != true, "This address is currently in processing");

        //Fist step convert Stable1 to USD
        uint256 usd = mul(div(amount, stable1.price), priceFloatDigit);
       

        bool freeTaxe = taxesFreeHolder[msg.sender];

        uint256 taxes = 0;

        if(!freeTaxe )
        {
            //Calculate Taxes
            taxes = div(mul(usd, tradeFees), 10**4); 

            if(USDToken.balanceOf(address(this)) > taxes)
            {
                //distribute taxes
                for(uint i;  i < feesOwners.length; i++ )
                {
                        uint256 ownerPercent = feesOwners[i].percent;
                        address ownerAddr = feesOwners[i].owner;

                        uint256 feesPercent =div(mul(taxes, ownerPercent), 100); 
                        USDToken.transfer(address(ownerAddr), feesPercent);
                }
                
            }
      
        }
    
        //Set that user is in the process
        senderInProcess[msg.sender] = true;

        //Smart contract Burn those tokens  
        stableCoin1.burnFrom(msg.sender, amount);
       
        //Decrease usd reserve allocate to  Stable1
        updateStableReserve(stable1.tokenAddress, usd, Operation.SUB);

        //Get amount after tax
        uint256 usdr = usd - taxes;
    
        //Second step convert USD to Stable2
        uint256 tokens = div(mul(usdr, stable2.price), priceFloatDigit);

        //Smart contract Mint the Stable2
        stableCoin2.mint(msg.sender, tokens);

        //Update reserve allocate to  Stable2
        updateStableReserve(stable2.tokenAddress, usdr, Operation.ADD);

        //Set that user finished the process
        senderInProcess[msg.sender] = false;

        //Operation successful
        return true;
    }

    function buyStable(address tokenAddress, uint256 usdAmount) public  whenNotPaused returns (bool) {

        //Initialize ERC20 token
        ERC20Stable stableCoin = ERC20Stable(tokenAddress);


        //Get stable information
        Stable memory stable = getStableByAddress(stableCoin);
        

        //Check amount USD, Balance, allowance, token price
        require(usdAmount > 0, "Usd amount can't be zero");
        require(USDToken.balanceOf(msg.sender) >= usdAmount, "Token not enough");
        require(USDToken.allowance(msg.sender, address(this)) >= usdAmount, "Allowance not enough");
        require(stable.price > 0, "Price has not been defined");


        bool freeTaxe = taxesFreeHolder[msg.sender];

        uint256 taxes = 0;

        if(!freeTaxe){
            //Calculate Taxes
            taxes  = div(mul(usdAmount,fees), 10**4); 

            if(USDToken.balanceOf(address(this))> taxes)
            {
                    //distribute taxes
                    for(uint i;  i < feesOwners.length; i++ )
                    {
                            uint ownerPercent = feesOwners[i].percent;
                            address ownerAddr = feesOwners[i].owner;

                            uint256 feesPercent =div(mul(taxes, ownerPercent), 100); 
                            USDToken.transfer(address(ownerAddr), feesPercent);
                    }
                    
            }
           
        }

    
        //Get Tax
        uint256 usdAfterTaxed = sub(usdAmount, taxes);
        //Get token amount to send after tax
        uint256 tokens = div(mul(usdAfterTaxed, stable.price), priceFloatDigit);

     
        //Tranfer USD from the sender to the smart contract
        USDToken.transferFrom(msg.sender, address(this), usdAmount);

 
        
        //Update reserve allocate to this stable
        updateStableReserve(stableCoin, usdAfterTaxed, Operation.ADD);

      
        //Smart contract Mint the token
        stableCoin.mint(msg.sender, tokens);
    

        return true;
    }

    function sellStable(address tokenAddress, uint256 tokenAmount) public whenNotPaused returns (bool) {

        //Initialize ERC20 token
        ERC20Stable stableCoin = ERC20Stable(tokenAddress);
      
        //Get stable information
        Stable memory stable = getStableByAddress(stableCoin);
       
        //Check amount USD, Balance, allowance, token price
        require(tokenAmount > 0, "Amount need to be greater than zero");
        require(stableCoin.balanceOf(msg.sender) >= tokenAmount, "Token not enough");
        require(stableCoin.allowance(msg.sender, address(this)) >= tokenAmount, "Allowance not enough");
        require(stable.price > 0, "Price has not been define");


        uint256 usd = mul(div(tokenAmount, stable.price), priceFloatDigit);

        bool freeTaxe = taxesFreeHolder[msg.sender];

        uint256 taxes = 0;

        if(!freeTaxe){
        //Calculate Taxes
         taxes  = div(mul(usd,fees), 10**4);

         if(USDToken.balanceOf(address(this)) > taxes){
          
            //distribute taxes
            for(uint i;  i < feesOwners.length; i++ )
            {
                    uint256 ownerPercent = feesOwners[i].percent;
                    address ownerAddr = feesOwners[i].owner;

                    uint256 feesPercent = div(mul(taxes, ownerPercent), 100); 
                    USDToken.transfer(address(ownerAddr), feesPercent);
            }
         }

        }

        uint256 usdAfterTaxed = usd - taxes;

        //Burn those tokens         
        stableCoin.burnFrom(msg.sender, tokenAmount);
     

        //Send USD to the sender
        USDToken.transfer(msg.sender, usdAfterTaxed);

        //Update reserve allocate to this stable
        updateStableReserve(stableCoin, usdAfterTaxed, Operation.SUB);
        //Operation successful

    

       return true;
    }

    function sendStable(address erctoken, address to,  uint256 amount) public whenNotPaused returns (bool) {


        require(amount > 0, "Tokens amount can't be zero");
        require(erctoken != address(0), "ERC20 can't be null address");
        require(to != address(0), "Recipient can't be null address");

        ERC20Stable ErcToken  = ERC20Stable(erctoken);
        require(ErcToken.balanceOf(msg.sender) >= amount, "Token not enough");
        

      
        ErcToken.transferFrom(msg.sender, to , amount);

        return true;
    }



    // ===================================================================================================================
    //
    // ==================================================Stables and Ubeswap Swapping=====================================


    function swapStable(address tok_in, address tok_out, address[] memory path,  uint256 amount) public whenNotPaused{


        require(amount > 0, "Amount can't be zero");
        require(tok_in != tok_out, "Can't swap same tokens");

       

        ERC20 token1  = ERC20(tok_in);
     

        Stable memory stable ;
        ERC20Stable stableToken ;

        if(tok_in != path[0])
        {
            stableToken  = ERC20Stable(tok_in);
            stable = getStableByAddress(stableToken);
        }

        else if(tok_out != path[path.length-1])
        {
            stableToken  = ERC20Stable(tok_out);
            stable = getStableByAddress(stableToken);
        }

       
        bool freeTaxe = taxesFreeHolder[msg.sender];

        uint taxes = 0;

        // uint usdAmount = amount;

        if( stable.tokenAddress == ERC20Stable(tok_in)){
               
                
            require(stableToken.balanceOf(msg.sender) >= amount, "Token not enough");
            require(stableToken.allowance(msg.sender, address(this)) >= amount, "Allowance not enough");  



            uint256 usd = mul(div(amount, stable.price), priceFloatDigit); // Convert  to usd

            if(!freeTaxe){
                //Calculate Taxes
                taxes  = div(mul(usd,tradeFees), 10**4);

                if(USDToken.balanceOf(address(this))> div(taxes, 2)){
                     USDToken.transfer(address(manager), div(taxes, 2));
                }
              
            }

            uint256 usdAfterTaxed = usd - taxes; // remove fees total amount

        
            //Get sender TGOUD and Burn them tokens 
            stableToken.burnFrom(msg.sender,  amount);

            //Allow Quickswap to use the amount of usd
            USDToken.approve(address(router), usdAfterTaxed);

            //Swap the USD to token
            router.swapExactTokensForTokens(
            usdAfterTaxed,
            0,
            path,
            msg.sender,
            block.timestamp
            );

            //Update reserve allocate to this stable
            updateStableReserve(stableToken, usd, Operation.SUB);

        }
        else if( stable.tokenAddress ==  ERC20Stable(tok_out)){
              
            token1.transferFrom(
            msg.sender,
            address(this),
            amount
            );

            //Allow uniswap to use the amount of usd
            token1.approve(address(router), amount);

            //Swap the token to USD 
            uint[] memory  amounts = router.swapExactTokensForTokens(
            amount,
            0,
            path,
            address(this),
            block.timestamp
            );

            uint amountOut = amounts[amounts.length-1];
       
            if(!freeTaxe){
             //Calculate Taxes
             taxes  = div(mul(amountOut,tradeFees), 10**4); 

               if(USDToken.balanceOf(address(this))> div(taxes, 2)){
                     USDToken.transfer(address(manager), div(taxes, 2));
               }
            
            }


            uint256 usdAfterTaxed = amountOut - taxes;

            uint256 tokens = div(mul(usdAfterTaxed, stable.price), priceFloatDigit);


            stableToken.mint(msg.sender, tokens);
            // //Transfer tax
            USDToken.transfer(address(manager), div(taxes, 2));

            updateStableReserve(stableToken, usdAfterTaxed, Operation.ADD);

        }
        else{
            //Transfer token1 to the smart Contract
            token1.transferFrom(
            msg.sender,
            address(this),
            amount
            );
       
            if(!freeTaxe){
                //Calculate Taxes
                taxes  = div(mul(amount,tradeFees), 10**4);
                if(token1.balanceOf(address(this))> div(taxes, 2)){
                    token1.transfer(address(manager), div(taxes, 2));
                }

            }
         
            uint256 amountAfterTaxed = amount - taxes;

            //Allow Quickswap to use the amount of usd
            token1.approve(address(router), amountAfterTaxed);

            //Swap the USD to token
            router.swapExactTokensForTokens(
            amountAfterTaxed,
            0,
            path,
            msg.sender,
            block.timestamp
            );
        }
       
    }

    function lendingDepositStable(address stableToken,  uint256 stableAmount) public whenNotPaused returns(bool){
        ERC20Stable stableCoin = ERC20Stable(stableToken);
        Stable memory stable = getStableByAddress(ERC20Stable(stableCoin));
        require(stableCoin.balanceOf(msg.sender) >= stableAmount, "Token not enough");

        uint256 amount = div(stableAmount, div(stable.price, priceFloatDigit));
        
        //Burn those tokens         
        stableCoin.burnFrom(msg.sender, stableAmount);

        //Allow Aave to use the amount of usd
        USDToken.approve(address(lendingPool), amount);

        lendingPool.deposit(address(USDToken), amount, msg.sender, 0);
        return true;

    }

    function lendingWithdrawStable( address stableToken, uint256 ausdAmount) public whenNotPaused  returns(bool){

        ERC20Stable stableCoin = ERC20Stable(stableToken);
        Stable memory stable = getStableByAddress(ERC20Stable(stableCoin));
        require(AUSDToken.balanceOf(msg.sender) >= ausdAmount, "Token not enough");
        require(AUSDToken.allowance(msg.sender, address(this)) >= ausdAmount, "Allowance not enough");

        //Allow Aave to use the amount of usd
        uint256  tokens = mul(ausdAmount, div(stable.price, priceFloatDigit));

        AUSDToken.transferFrom(msg.sender, address(this), ausdAmount);
        lendingPool.withdraw(address(USDToken), ausdAmount, address(this));

        stableCoin.mint(msg.sender, tokens);
    
        return true;
        
    }

    function lendingDepositReseve(uint256 amount) public onlyOwner  returns(bool){
        uint256 balance = USDToken.balanceOf(address(this));
        require(amount > 0 && amount <=balance, "Amount can't be zero and must be less or equal to the balance");
        //Allow Aave to use the amount of usd
        USDToken.approve(address(lendingPool), amount);
        lendingPool.deposit(address (USDToken), amount, address(this), 0);
        return true;

    }

    function lendingWithdrawReseve(uint256 amount) public onlyOwner  returns(bool){

        lendingPool.withdraw(address(USDToken), amount, address(this));
        return true;
        
    }
 
    function swapEstimation(address[] memory path,  uint256 amount) public view returns(uint[] memory amounts){

        return router.getAmountsOut(amount, path);
    }

    function swapStableEstimation(address token, address[] memory path,  uint256 amount) public view whenNotPaused returns(uint256){
      
        Stable memory stable = getStableByAddress(ERC20Stable(token));

        if(address(path[0]) == address(USDToken)){
            uint256 amount_ = div(amount, div(stable.price, priceFloatDigit));
            uint[] memory  amounts =  router.getAmountsOut(amount_, path);
            return amounts[amounts.length-1];
        } else if(address (path[path.length-1]) == address(USDToken) ){
            uint[] memory  amounts = router.getAmountsOut(amount, path);
            uint256 amountOut = mul(amounts[amounts.length-1], div(stable.price, priceFloatDigit));
            return amountOut;
        }else{
            return 0;
        }
       
    }
 
    function getUSDReserve() public view  returns(uint256){
            return USDToken.balanceOf(address(this));
    }

    function getStableReserve(ERC20Stable _tokenAddress) public view returns(uint256){
            

            for(uint i;  i < stables.length; i++ )
            {
                if(stables[i].tokenAddress == _tokenAddress){
                    
                    return stables[i].tokenReserve;
                }
                    
            }

            return 0; 
    }

    function emergencyTransferReseve(address recipient) public onlyOwner  returns(bool){
        uint256 balance = USDToken.balanceOf(address(this));
        USDToken.transfer(recipient, balance);
        return true;
    }




    // ===================================================================================================================

    // =======================================================Math function===============================================



    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
      assert(b <= a);
      return a - b;
    }
    
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
      uint256 c = a + b;
      assert(c >= a);
      return c;
    }

    function mul(uint256 a, uint256 b) public pure returns (uint256 ) {
        uint256 c = a * b;
        
        assert(a == 0 || c / a == b);
            return c;
    }

    function div(uint256 a, uint256 b) public pure returns (uint256 ) {
        assert(b > 0);
        uint256	c = a / b;
        return c;
    }

   }

