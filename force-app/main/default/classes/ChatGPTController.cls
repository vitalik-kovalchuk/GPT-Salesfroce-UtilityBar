public with sharing class ChatGPTController {
	public static final String GPT_KEY = 'YOU_KEY-HERE';

	

	@AuraEnabled(cacheable=true)
	public static Map<String,Object> initChatGPT( ) {
		Map<String,Object> result = new  Map<String,Object>();
		// check for key here
		result.put('active', String.isNotBlank(GPT_KEY));
		return result;
	}

	@AuraEnabled(cacheable=true)
	public static Map<String,Object> sendMessageToChatGPT( Map<String,Object> param) {


		String messageQuestion = param.containsKey('message') ? (String) param.get('message') : '';
		if( String.isBlank( messageQuestion )) throw new GPTException( 'Message is Empty!');

		Map<String,Object> result = new  Map<String,Object>();
		result.put('answer', '');
		result.put('id', '');
		Http http = new Http();
		HttpResponse httpResponse;
		HttpRequest req = new HttpRequest(); 
 		req.setMethod('POST');
		req.setEndpoint('https://api.openai.com/v1/completions');
		req.setTimeout(120 * 1000);
		req.setHeader('Accept', 'application/json' );
		req.setHeader('Content-Type', 'application/json' );
		req.setHeader('Authorization',  'Bearer ' + GPT_KEY );

		Map<String,Object> requestData = new Map<String,Object>{
			'model' => 'text-davinci-003',
			'prompt' => messageQuestion,
			'max_tokens' => 4000,
			// 'user' => 1,
			'temperature' =>  0.5
			// 'frequency_penalty' => 0.0, 
			// 'presence_penalty' => 0.0
		   
		};
		req.setBody(JSON.serialize(requestData));

		try {
			httpResponse = http.send( req );
			String status = httpResponse.getStatus();
			Integer statusCode = httpResponse.getStatusCode();
			String bodyAnswer  = httpResponse.getBody();
			if( statusCode == 200 || statusCode == 201) {
				GptAnswerWrapper answer = (GptAnswerWrapper) JSON.deserialize(bodyAnswer, GptAnswerWrapper.class);
				if( !answer.choices.isEmpty() && String.isNotBlank(answer.choices[0].text)) {
					result.put('answer', answer.choices[0].text);
					result.put('id', answer.id);
				}
			}
		} catch(Exception error) {
			throw new GPTException( error.getMessage() + ' ' + error.getLineNumber() );
		}
		return result;
	}

	public class GPTException extends Exception {}

	public class GptAnswerWrapper {
		public String id { set; get;}
		public String created { set; get;}
		public String model { set; get;}
		public List<gptAnswerChoiseWrapper> choices { set; get;}
	}

	public class gptAnswerChoiseWrapper {
		public String text { set; get;}
		public String finish_reason { set; get;}
		public Integer index { set; get;}
	}
}
