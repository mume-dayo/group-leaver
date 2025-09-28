function log(message) {
    const output = document.getElementById('output');
    output.textContent += message + '\n';
}

async function renameAndLeaveGroups() {
    const token = document.getElementById('token').value;
    const newGroupName = document.getElementById('newGroupName').value;
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
        
        if (newGroupName) {
            log(`[i] ${groups.length}個のグループの名前を変更してから離脱します`);
        } else {
            log(`[i] ${groups.length}個のグループから離脱します (名前変更なし)`);
        }
        
        let batchSize = 4;
        let delay = 300;
        
        for (let i = 0; i < groups.length; i += batchSize) {
            const batch = groups.slice(i, i + batchSize);
            
            const promises = batch.map(async (group, index) => {
                try {
                    let finalGroupName = group.name || 'グループDM';

                    if (newGroupName) {
                        log(`[~] ${group.name || 'グループDM'} の名前を変更中...`);
                        const renameResponse = await fetch(`https://discord.com/api/v9/channels/${group.id}`, {
                            method: 'PATCH',
                            headers: headers,
                            body: JSON.stringify({
                                name: newGroupName
                            })
                        });
                        
                        if (renameResponse.status === 429) {
                            const retryAfter = renameResponse.headers.get('retry-after') || 5;
                            log(`[!] レート制限中... ${retryAfter}秒待機、速度を落とします`);
                            batchSize = 3;
                            delay = 500;
                            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                            return;
                        }
                        
                        if (renameResponse.ok) {
                            log(`[✓] ${group.name || 'グループDM'} → ${newGroupName} に名前変更完了`);
                            finalGroupName = newGroupName;
                            
                            await new Promise(resolve => setTimeout(resolve, 200));
                        } else {
                            log(`[!] ${group.name || 'グループDM'} の名前変更に失敗`);
                        }
                    }
                    
                    const leaveResponse = await fetch(`https://discord.com/api/v9/channels/${group.id}`, {
                        method: 'DELETE',
                        headers: headers
                    });
                    
                    if (leaveResponse.status === 429) {
                        const retryAfter = leaveResponse.headers.get('retry-after') || 5;
                        log(`[!] 離脱時レート制限中... ${retryAfter}秒待機、速度を落とします`);
                        batchSize = 3;
                        delay = 500;
                        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                        return;
                    }
                    
                    if (leaveResponse.ok) {
                        log(`[✓] ${finalGroupName} から離脱完了 (${i + index + 1}/${groups.length})`);
                    } else {
                        log(`[!] ${finalGroupName} からの離脱に失敗`);
                    }
                } catch (error) {
                    log(`[!] ${group.name || 'グループDM'} の処理中にエラー: ${error.message}`);
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
        btn.textContent = 'グループ名変更→離脱';
    }
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
        
        let batchSize = 4;
        let delay = 200;
        
        for (let i = 0; i < groups.length; i += batchSize) {
            const batch = groups.slice(i, i + batchSize);
            
            const promises = batch.map(async (group) => {
                const response = await fetch(`https://discord.com/api/v9/channels/${group.id}`, {
                    method: 'DELETE',
                    headers: headers
                });
                
                if (response.status === 429) {
                    const retryAfter = response.headers.get('retry-after') || 5;
                    log(`[!] レート制限中... ${retryAfter}秒待機、速度を落とします`);
                    batchSize = 3;
                    delay = 500;
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    return;
                }
                
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
