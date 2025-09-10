function log(message) {
    const output = document.getElementById('output');
    output.textContent += message + '\n';
}

async function leaveAllGroups() {
    const token = document.getElementById('token').value;
    const btn = document.getElementById('executeBtn');
    const output = document.getElementById('output');
    
    if (!token) {
        alert('トークンを入力してください');
        return;
    }
    
    btn.disabled = true;
    btn.textContent = '処理中...';
    output.textContent = '';
    
    const headers = {
        'Authorization': token,
        'Content-Type': 'application/json'
    };
    
    try {
        log('[i] グループ一覧を取得中...');
        const response = await fetch('https://discord.com/api/v9/users/@me/channels', {
            method: 'GET',
            headers: headers
        });
        
        if (!response.ok) {
            throw new Error(`グループ取得失敗: ${response.status}`);
        }
        
        const channels = await response.json();
        const groups = channels.filter(g => g.type === 3);
        
        log(`[i] ${groups.length}個のグループから離脱します`);
        
        const batchSize = 5;
        const delay = 1000;
        
        for (let i = 0; i < groups.length; i += batchSize) {
            const batch = groups.slice(i, i + batchSize);
            
            const promises = batch.map(async (group) => {
                const response = await fetch(`https://discord.com/api/v9/channels/${group.id}`, {
                    method: 'DELETE',
                    headers: headers
                });
                
                if (response.ok) {
                    log(`[✓] ${group.name || 'グループDM'} から離脱完了 (${i + batch.indexOf(group) + 1}/${groups.length})`);
                }
            });
            
            await Promise.all(promises);
            
            if (i + batchSize < groups.length) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        log(`[✓] ${groups.length}件の処理が完了`);
        
    } catch (error) {
        log(`[!] エラー: ${error.message}`);
    } finally {
        btn.disabled = false;
        btn.textContent = '全グループから離脱';
    }
}
