const { RED, WHITE, GREEN, BLUE, CYAN, MAGENTA, YELLOW } = require("../utility/colors");
const serverDB = require("../models/serverDB");
const mongoose = require("mongoose");
const axios = require("axios");

/*

APIBuilder is strictly for Minecraft Endpoints to help with management commands.

Quick example of how it's built using serverData object:

        const request = new APIBuilder({
            serverID: serverData.serverID, // REQUIRED
            token: serverData.linkData.accessToken, // REQUIRED
            requestType: 1 // REQUIRED
            urlParams: [selectedRealm.realmID.toString()], // OPTIONAL
            methodType: "get", // REQUIRED
            returnType: "conLog" // OPTIONAL, defaults to console.log
        });

        await request.send();

        Further Explanation:

            - urlParams is an array of possible values used IN ORDER FROM OBJECT 0 ONWARD in your api if provided.

            requestType list:
                1 // GET worlds
                2 // GET worlds/id
            
            
            methodType list:
                "get"
                "post"
                "put"
                "delete"

            returnType list:
                "conLog" // will console.log the request data
                "object" // will return a full object of the request data
                "status" // will only return the status code of the request

*/

class APIBuilder {
    constructor(options, debug) {
        this.options = {
            serverID: options.serverID, // guild id
            token: options.token, // serverData.linkData.accessToken
            requestType: typeOfRequest(options.requestType), // number of the request (SEE BELOW)
            urlParams: [options.urlParams], // url params if needed such as XUID, etc.
            methodType: typeOfMethod(options.methodType), // get, post, put, delete
            returnType: typeOfReturn(options.returnType), // console.log, {...data}, variable, json file
        };
        this.debug = debug;
        if (debug !== true || false) {
            this.debug = false;
        }
        this.status = null;
        /*

        status list:
            - success: request was successful
            - failure: error occured
            - timeout: request took too long
            - validating: request options are being validated
            - valid: request options are valid
            - invalid: a request option was invalid
            - fetching: request options were valid, fetching data
        */
        if (!options) {
            return console.trace(`[${MAGENTA}API Builder${WHITE}]  >>>  ${RED}Error: ${WHITE}No options provided!`);
        }
        this.validateBuild(options, debug);
    }

    async validateBuild(options, debug) {

        this.status = "validating";

        // serverID validation
        if (debug === true) console.log(`[${YELLOW}DEBUG${WHITE}] [${MAGENTA}API Builder${WHITE}]  >>>  Validating api request. . .`);
        if (options.serverID !== typeof Number) return console.trace(`[${MAGENTA}API Builder${WHITE}]  >>>  ${RED}Error: ${WHITE}Server ID MUST be a number!`);
        if (!options.serverID) return console.trace(`[${MAGENTA}API Builder${WHITE}]  >>>  ${RED}Error: ${WHITE}Server ID MUST be provided!`);
        if (await findGuild(options.serverID) === false) return console.trace(`[${MAGENTA}API Builder${WHITE}]  >>>  ${RED}Error: ${WHITE}Guild not found! (serverID is incorrect)`);

        // token validation
        if (options.token !== typeof String) return console.trace(`[${MAGENTA}API Builder${WHITE}]  >>>  ${RED}Error: ${WHITE}Token value is not a string!`);
        if (await checkToken(options.token) === false) return console.trace(`[${MAGENTA}API Builder${WHITE}]  >>>  ${RED}Error: ${WHITE}Invalid token, user must re-link`);

        // requestType is already validated

        // urlParams validation
        if (options.urlParams.length >= 3) {
            if (debug === true) console.log(`[${YELLOW}DEBUG${WHITE}] [${MAGENTA}API Builder${WHITE}]  >>>  Possible false error, URL Params were found to be 3 or more objects in length.`);
            this.status = "failure";
            return console.trace(`[${MAGENTA}API Builder${WHITE}]  >>>  ${RED}Error: ${WHITE}Too many url params provided, there should be a maximum of 2!`);
        }

        // methodType is already validated
    
        // returnType is already validated

        this.status = "valid";
    }

    async send() {
        if (this.status === "valid") {
            if (this.debug === true) console.log(`[${YELLOW}DEBUG${WHITE}] [${MAGENTA}API Builder${WHITE}]  >>>  Options are valid, fetching request. . .`);
            if (this.options.requestType === 1) {
                let url = `Real URL Here`;
                await this.getRequest(url, this.options.token, this.options.returnType);
            }
        }

        if (this.status !== "valid" && this.status !== "failure" && this.status !== "timeout") {
            await this.validateBuild(this.options, this.debug);
        }
    }

    async getRequest(url, token, returnType) {
        return console.log(`The url is: ${url}, the token is ${token}, and the returnType is ${returnType}`); // testing
    }
}

module.exports = {
    APIBuilder
}

function typeOfRequest(number) {
    if (number != typeof Number) return console.trace(`[${MAGENTA}API Builder${WHITE}]  >>>  ${RED}Error: ${WHITE}Request type MUST be a number!`);
    if (!number) return console.trace(`[${MAGENTA}API Builder${WHITE}]  >>>  ${RED}Error: ${WHITE}Request type MUST be provided!`);
    switch (number) {
        case 1:
            return 1;
        case 2:
            return 2;
    }
}

function typeOfMethod(type) { // you need to put a method type dummy ("get", "post", "put", "delete")
    if (type != typeof String) return console.trace(`[${MAGENTA}API Builder${WHITE}]  >>>  ${RED}Error: ${WHITE}Method type MUST be a string!`);
    if (!type) return console.trace(`[${MAGENTA}API Builder${WHITE}]  >>>  ${RED}Error: ${WHITE}Method type MUST be provided!`);
    let dataType;
    switch (type) {
        case "get":
            dataType = "get";
            break;
        case "post":
            dataType = "post";
            break;
        case "put":
            dataType = "put";
            break;
        case "delete":
            dataType = "delete";
            break;
    }
    return dataType;
}

function typeOfReturn(type) { // you need to put a return type dummy ("conLog", "object", "file", "variable")
    if (type != typeof String) return console.trace(`[${MAGENTA}API Builder${WHITE}]  >>>  ${RED}Error: ${WHITE}Return type MUST be a string!`);
    if (!type) return console.trace(`[${MAGENTA}API Builder${WHITE}]  >>>  ${RED}Error: ${WHITE}Return type MUST be provided!`);
    let dataType;
    switch (type) {
        case "conLog":
            dataType = "conLog";
            break;
        case "object":
            dataType = "object";
            break;
        /*
        case "file":
            dataType = "file";
            break;
        case "variable":
            dataType = "variable";
            break;
        */
        case "status":
            dataType = "status";
            break;
        default:
            dataType = "conLog";
            break;
    }
    if (dataType !== "conLog" && dataType !== "object" && dataType !== "file" && dataType !== "variable") return console.trace(`[${MAGENTA}API Builder${WHITE}]  >>>  ${RED}Error: ${WHITE}Invalid return type!\n\n${GREEN}VALID TYPES:${WHITE}\n\n- "conLog"\n- "object"\n- "status"`);
    return dataType;
}

async function findGuild(id) {
    const serverData = await serverDB.findOne({ serverID: id });
    if (!serverData) {
        return false;
    } else {
        return true;
    }
}

async function checkToken(token) {
    const response1 = await axios.post(
        "https://user.auth.xboxlive.com/user/authenticate",
        {
          Properties: {
            AuthMethod: "RPS",
            RpsTicket:
              token,
            SiteName: "user.auth.xboxlive.com",
          },
          RelyingParty:
            "http://auth.xboxlive.com",
          TokenType: "JWT",
        }
      );

    const response2 = await axios.post('https://xsts.auth.xboxlive.com/xsts/authorize', {
        Properties: {
            SandboxId: 'RETAIL',
            UserTokens: [response1.data.Token],
        },
        RelyingParty: "http://xboxlive.com",
        TokenType: 'JWT',
    });

    if (response2.data) {
        return true;
    } else {
        return false;
    }
}