import {LightningElement, api, track, wire} from 'lwc';
import initChatGPT from '@salesforce/apex/ChatGPTController.initChatGPT';
import sendMessageToChatGPT from '@salesforce/apex/ChatGPTController.sendMessageToChatGPT';
import { showErrorNew } from 'c/componentHelper'; 
import USER_ID from '@salesforce/user/Id';
import NAME_FIELD from '@salesforce/schema/User.Name';
import {getRecord} from 'lightning/uiRecordApi';

const optionsDate = {
	year: 'numeric', month: 'numeric', day: 'numeric',
	hour: 'numeric', minute: 'numeric', second: 'numeric',
	hour12: false
};

const DELAY = 2000; 
export default class ChatGPT extends LightningElement {
	isLoaded = true;
	conversation = [];
	messageUserInput = '';


	@track initData = {
		initSuccess: false,
		userName: '',
		currentDate: new Intl.DateTimeFormat( 'en-US', optionsDate ).format( new Date() )
	};


	@wire(getRecord, {recordId: USER_ID, fields: [NAME_FIELD]})
	wireuser({ error, data }) {
		if (error) {
			showErrorNew( error );
		} else if (data) {
			this.initData.userName = data.fields.Name.value;
		}
	}
	   


	@wire(initChatGPT)
	loadChatInfo(result) {
		const { data, error } = result;
		if( data ) {
			if( data.active ) this.initData.initSuccess  = true;
			this.isLoaded = false;


			
				console.log('start  one ');
				this.conversation.push( this.setChatMessageOutbound('Hi! Ask me any question'));
			

			// setTimeout( () => {
			// 	console.log('start  two ');
			// 	this.conversation.push( this.setChatMessageOutbound('Hi! Ask me any question 2'));
			// }, 7000);

		} else if(error) {
			showErrorNew( error );
		}
	}

	changeUserMessage(event) {
		const eventValue = event.target.value;
		if( eventValue ) {
			console.log('changeUserMessage ' + eventValue  );
			this.messageUserInput = eventValue;
		}
	}

	async handleEnterMessage(evt) {
		const isEnterKey = evt.keyCode === 13;
        if( isEnterKey && this.messageUserInput) {
			console.log('changeUserMessage 2 ' + this.messageUserInput  );
			this.conversation.push( this.setChatMessageInternal( this.messageUserInput));
			
			this.isLoaded = true;
			window.clearTimeout(this.delayTimeoutSetting);
			this.delayTimeoutSetting = setTimeout( async () => {
				try {	
					const { answer, id } = await sendMessageToChatGPT({param: {
						message: this.messageUserInput
					}});
					// let answer = 'rgrgrtgrt';
					// let id = 'grtgr';
					console.log('answer ' + answer);
					console.log('id ' + id);
					if( answer ) {
						this.conversation.push( this.setChatMessageOutbound(answer));
						this.messageUserInput = '';

					}
					this.isLoaded = false;
				} catch(error) {
					showErrorNew( error );
				}
			}, DELAY);

            // this.queryName = evt.target.value;
            // evt.target.value = "isConversation";
            // this.searchPeople(evt);
        }
	}

	setChatMessageInternal(messageText) {
		const message = { 
			agent: 'Chat GPT',
			message: messageText,
			stamp : new Date().getTime().toString() + messageText,
			classSection : 'slds-chat-listitem slds-chat-listitem_inbound',
			classChat : 'slds-chat-message__text slds-chat-message__text_inbound',
			dateTime : new Intl.DateTimeFormat( 'en-US', optionsDate ).format( new Date() )
		}
		return message;
	}

	setChatMessageOutbound(messageText) {
		const message = { 
			agent: this.initData.userName,
			message: messageText,
			stamp : new Date().getTime().toString() + messageText,
			classSection : 'slds-chat-listitem slds-chat-listitem_outbound',
			classChat : 'slds-chat-message__text slds-chat-message__text_outbound',
			dateTime : new Intl.DateTimeFormat( 'en-US', optionsDate ).format( new Date() )
		}
		return message;
	}
}