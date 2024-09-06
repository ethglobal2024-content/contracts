import {BrowserProvider, Contract, ethers, TransactionReceipt} from "ethers";
import { chatMessage } from "./helpers/message"; // Import the message from message.ts
import * as dotenv from "dotenv";
import {ChatMessage} from './helpers/interface'
import { Log } from "@ethersproject/abstract-provider"; // Import the correct type for Log events

dotenv.config(); // Load .env file

export interface ChatGPInstance {
    setConversation: (messages: ChatMessage[]) => void
    getConversation: () => ChatMessage[]
    focus: () => void
  }
  

async function main() {
  // Get the private key from .env file
  const privateKey = process.env.PRIVATE_KEY_GALADRIEL;

  if (!privateKey) {
    throw new Error("Please set your PRIVATE_KEY in the .env file");
  }

  // Define the network (Galadriel)
  const provider = new ethers.JsonRpcProvider("https://devnet.galadriel.com/");
  const wallet = new ethers.Wallet(privateKey, provider);

  // Define the contract address and ABI
  const contractAddress = "0xD3Cc97B3D3C87B19f35b8EE28494c52462664ACC";

  const abi = [
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "message",
          "type": "string"
        }
      ],
      "name": "startChat",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "chatId",
            "type": "uint256"
          }
        ],
        "name": "getMessageHistory",
        "outputs": [
          {
            "components": [
              {
                "internalType": "string",
                "name": "role",
                "type": "string"
              },
              {
                "components": [
                  {
                    "internalType": "string",
                    "name": "contentType",
                    "type": "string"
                  },
                  {
                    "internalType": "string",
                    "name": "value",
                    "type": "string"
                  }
                ],
                "internalType": "struct IOracle.Content[]",
                "name": "content",
                "type": "tuple[]"
              }
            ],
            "internalType": "struct IOracle.Message[]",
            "name": "",
            "type": "tuple[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "uint256",
            "name": "chatId",
            "type": "uint256"
          }
        ],
        "name": "ChatCreated",
        "type": "event"
      }
  ];

  // Create a contract instance
  const contract = new Contract(contractAddress, abi, wallet);

  try {
    // Call the startChat function with the message
    const tx = await contract.startChat(chatMessage);
    console.log("Transaction sent! Waiting for confirmation...");

    // Wait for the transaction to be mined
    const receipt: TransactionReceipt = await tx.wait(); // This is of type ethers.providers.TransactionReceipt
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

    console.log("receip:", receipt);

    const chatId = await getChatId(receipt, contract);

    if (chatId === undefined) {
        throw new Error("Chat ID could not be determined from the transaction receipt.");
    }

    console.log("Chat ID retrieved:", chatId);


    while (true) {
        const newMessages: ChatMessage[] = await getNewMessages(contract, chatId);
    
    
        if (newMessages) {
            const lastMessage = newMessages.at(-1); // Get the last message in the array
    
            if (lastMessage) {
                const role = lastMessage.role; // Accessing the role directly
                const content = lastMessage.content; // Accessing the content directly
    
                console.log("Extracted role:", role);
    
                if (role === "assistant") {
                    // If the last message is from the assistant, break the loop and return the message
                    console.log("Assistant message received:", content);
                    return lastMessage; // Return the lastMessage object
                } else {
                    console.log("Last message is not from the assistant. Retrying in 2 seconds...");
                }
            }
        } else {
            console.log("No messages received. Retrying in 2 seconds...");
        }
    
        // Wait for 2 seconds before polling again to avoid excessive network requests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

  } catch (error) {
    console.error("An error occurred while starting the chat:", error);
  }
}

async function getChatId(receipt: TransactionReceipt, contract: Contract): Promise<number | undefined> {
    let chatId
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log)
        if (parsedLog && parsedLog.name === "ChatCreated") {
          // Second event argument
          chatId = ethers.toNumber(parsedLog.args[1])
        }
      } catch (error) {
        // This log might not have been from your contract, or it might be an anonymous log
        console.log("Could not parse log:", log)
      }
    }
    return chatId;;
}

async function getNewMessages(
    contract: Contract,
    chatId: number
  ): Promise<ChatMessage[]> {
    console.log("Fetching message history for Chat ID:", chatId);
    const messages = await contract.getMessageHistory(chatId);
    const newMessages: ChatMessage[] = [];

    messages.forEach((message: any) => {
        // Assuming the structure is correct
        if (message && message.role && message.content) {
            newMessages.push({
                role: message.role,
                content: message.content[0][1] // Adjust if content structure differs
            });
        } else {
            console.log("Message has unexpected structure or missing fields:", message);
        }
    });

    return newMessages;
}

// Run the main function
main().catch((error) => {
  console.error("Error in main function:", error);
  process.exitCode = 1;
});