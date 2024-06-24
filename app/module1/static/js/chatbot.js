document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.createElement('input');
    chatInput.id = 'chat-input';
    chatInput.className = 'chat-input';
    chatInput.type = 'text';
    chatInput.placeholder = '메시지를 입력하세요...';
    
    const sendButton = document.createElement('button');
    sendButton.id = 'send-button';
    sendButton.className = 'send-button';
    sendButton.textContent = '전송';

    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';
    chatContainer.appendChild(chatInput);
    chatContainer.appendChild(sendButton);

    document.body.appendChild(chatContainer);

    const chatOutput = document.createElement('div');
    chatOutput.id = 'chat-output';
    chatOutput.className = 'chat-output';

    document.body.appendChild(chatOutput);

    sendButton.addEventListener('click', () => {
        const userMessage = chatInput.value;
        if (userMessage.trim() === '') return;

        appendMessage('user', userMessage);
        chatInput.value = '';

        fetchSummaryFromChatGPT(userMessage);
    });

    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendButton.click();
        }
    });

    function appendMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;
        messageElement.textContent = message;
        chatOutput.appendChild(messageElement);
        chatOutput.scrollTop = chatOutput.scrollHeight;
    }
});
