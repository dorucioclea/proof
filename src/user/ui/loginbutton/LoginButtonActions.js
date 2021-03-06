import { uport } from './../../../util/connectors.js'
import { browserHistory } from 'react-router'
import getWeb3, { getGanacheWeb3, Web3 } from '../../../util/getWeb3'


export const USER_LOGGED_IN = 'USER_LOGGED_IN'
function userLoggedIn(user) {
  return {
    type: USER_LOGGED_IN,
    payload: user
  }
}

export function loginUser() {
  return function(dispatch) {
    // UPort and its web3 instance are defined in ./../../../util/wrappers.
    // Request uPort persona of account passed via QR
    uport.requestCredentials().then((credentials) => {
      dispatch(userLoggedIn(credentials))

      // [Debug]
      console.log('=== credentials（created by uport.requestCredentials()）===', credentials)
      console.log('=== credentials["address"]（created by uport.requestCredentials()）===', credentials["address"])
      console.log('=== credentials["did"]（created by uport.requestCredentials()）===', credentials["did"])
      console.log('=== credentials["name"]（created by uport.requestCredentials()）===', credentials["name"])
      console.log('=== DataType of credentials["did"] ===', typeof credentials["did"])  // Result： string
 
      // Remove "did:ethr:" from credentials["address"]
      let userAddress = credentials["address"].replace("did:ethr:", '')
      console.log('=== userAddress===', userAddress)

      // Read contract of Profile.sol
      let Profile = {};
      try {
        Profile = require("../../../../build/contracts/Profile.json");
      } catch (e) {
        console.log(e);
      }
      const web3 = new Web3(window.ethereum);

      //const accounts = web3.eth.getAccounts();
      //const networkId = web3.eth.net.getId();
      const accounts = [];
      const networkId = [];
      web3.eth.getAccounts().then((accounts) => {
        console.log('=== accounts ===', accounts);   // Success
        console.log('=== accounts[0] ===', accounts[0]);   // Success

        web3.eth.net.getId().then((networkId) => {
          console.log('=== networkId ===', networkId); // Success

          const ContractAddress = Profile['networks'][networkId]['address'];
          
          let instanceProfile = null;
          instanceProfile = new web3.eth.Contract(Profile.abi, ContractAddress);
          console.log('=== Profile["networks"]["5777"]["address"] ===', Profile['networks']['5777']['address']);
          console.log('=== instanceProfile ===', instanceProfile);

          // if (instanceProfile) {
          //   // Set web3, accounts, and contract to the state, and then proceed with an
          //   // example of interacting with the contract's methods.
          //   this.setState({ web3, accounts, instanceProfile: instanceProfile });
          // }

          // Save in blockchain
          instanceProfile.methods.saveUser(userAddress, credentials['did'], credentials['name']).send({ from: accounts[0] }).then((saveUser) => {
            console.log('== saveUser ==', saveUser);
          })
          // instanceProfile.methods.saveUser("0x6464835fdb341a46bffe7a25d63f6d9076e3032a", "did:ethr:0x.....", "Taro Yamada").send({ from: accounts[0] }).then((saveUser) => {
          //   console.log('== saveUser ==', saveUser);
          // })

          // Get saved value in struct
          instanceProfile.methods.getUser(accounts[0]).call().then((p) => {
            console.log('== p ==', p);
          })
        })
      })


      // Used a manual redirect here as opposed to a wrapper.
      // This way, once logged in a user can still access the home page.
      var currentLocation = browserHistory.getCurrentLocation()

      if ('redirect' in currentLocation.query)
      {
        return browserHistory.push(decodeURIComponent(currentLocation.query.redirect))
      }

      return browserHistory.push('/dashboard')
    })
  }
}
