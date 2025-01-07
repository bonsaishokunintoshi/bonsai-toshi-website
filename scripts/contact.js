document.addEventListener('DOMContentLoaded', () => {
    const showEmailButton = document.getElementById('showEmail');
    const emailContainer = document.getElementById('emailContainer');
    let isEmailVisible = false;

    if (showEmailButton && emailContainer) {
        showEmailButton.addEventListener('click', () => {
            if (!isEmailVisible) {
                emailContainer.classList.remove('hidden');
                showEmailButton.textContent = 'メールアドレスを隠す';
                isEmailVisible = true;
            } else {
                emailContainer.classList.add('hidden');
                showEmailButton.innerHTML = 'メールアドレスを表示<span class="button-note">（スパム対策のため非表示）</span>';
                isEmailVisible = false;
            }
        });

        // 右クリック禁止（追加の保護）
        emailContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // メールアドレスの各パーツを動的に結合（スクレイピング対策）
        const emailParts = emailContainer.getElementsByClassName('email-part');
        const fullEmail = Array.from(emailParts).map(part => part.textContent).join('');
        
        // クリックでコピー機能
        emailContainer.addEventListener('click', () => {
            navigator.clipboard.writeText(fullEmail).then(() => {
                const originalText = emailContainer.innerHTML;
                emailContainer.innerHTML = 'コピーしました！';
                setTimeout(() => {
                    emailContainer.innerHTML = originalText;
                }, 1500);
            }).catch(err => {
                console.error('クリップボードへのコピーに失敗しました:', err);
            });
        });
    }
}); 