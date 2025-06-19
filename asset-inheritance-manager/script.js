class AssetManager {
    constructor() {
        this.assets = JSON.parse(localStorage.getItem('assets')) || [];
        this.inheritanceSettings = JSON.parse(localStorage.getItem('inheritanceSettings')) || {};
        this.exchangeRates = JSON.parse(localStorage.getItem('exchangeRates')) || {
            USD: 150.00,
            AUD: 100.00,
            EUR: 160.00,
            JPY: 1.00
        };
        this.lastCheckIn = localStorage.getItem('lastCheckIn') || new Date().toISOString();
        this.lastMonthlyUpdate = localStorage.getItem('lastMonthlyUpdate') || null;
        this.updateHistory = JSON.parse(localStorage.getItem('updateHistory')) || [];
        
        // しろくまウェルカムメッセージ
        this.welcomeMessages = [
            'ようこそじゃ🐻‍❄️',
            'いいかんじじゃの🐻‍❄️',
            'お疲れさまじゃ🐻‍❄️',
            'がんばってるの🐻‍❄️',
            'すばらしいじゃ🐻‍❄️',
            'よくできたの🐻‍❄️',
            'りっぱじゃの🐻‍❄️',
            'かしこいの🐻‍❄️',
            'えらいじゃの🐻‍❄️',
            'みごとじゃ🐻‍❄️'
        ];
        
        this.init();
    }

    init() {
        this.updateDashboard();
        this.updateAssetList();
        this.updatePrediction();
        this.updateInheritanceStatus();
        this.updateExchangeRateDisplay();
        this.updateMonthlyUpdateDisplay();
        this.updateAssetAdjustmentPanel();
        this.setupEventListeners();
        this.checkInactivity();
        this.checkMonthlyUpdate();
        
        // 初回起動時のウェルカムメッセージ
        setTimeout(() => {
            this.showNotification('システムを起動したの🐻‍❄️');
        }, 1000);
    }

    setupEventListeners() {
        // 資産追加フォーム
        document.getElementById('assetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addAsset();
        });

        // 相続設定フォーム
        document.getElementById('inheritanceForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveInheritanceSettings();
        });

        // 定期的な生存確認チェック
        setInterval(() => {
            this.checkInactivity();
        }, 3600000); // 1時間ごと
    }

    addAsset() {
        const assetType = document.getElementById('assetType').value;
        const assetName = document.getElementById('assetName').value.trim();
        const futurePrice = document.getElementById('futurePrice').value;
        
        // 編集モードかどうかを確認
        const isEditing = this.editingAssetId;
        
        // 名前が空の場合、自動生成（新規追加時のみ）
        let finalName = assetName;
        if (!finalName && !isEditing) {
            const sameTypeCount = this.assets.filter(a => a.type === assetType).length;
            finalName = `${assetType}${sameTypeCount + 1}`;
        }
        
        // 外国為替の場合の特別処理
        let currency, baseCurrency, targetCurrency, isForex = false;
        if (assetType === '外国為替') {
            isForex = true;
            baseCurrency = document.getElementById('forexBaseCurrency').value;
            targetCurrency = document.getElementById('forexTargetCurrency').value;
            currency = targetCurrency; // 資産の実際の通貨は投資対象通貨
        } else {
            currency = document.getElementById('currency').value;
            baseCurrency = currency;
            targetCurrency = currency;
        }
        
        // アクセス情報の取得
        const accessInfo = {
            institutionName: document.getElementById('institutionName').value.trim(),
            contactInfo: document.getElementById('contactInfo').value.trim(),
            loginId: document.getElementById('loginId').value.trim(),
            password: document.getElementById('password').value.trim(),
            twoFactorAuth: document.getElementById('twoFactorAuth').value,
            accessNotes: document.getElementById('accessNotes').value.trim()
        };
        
        if (isEditing) {
            // 編集モード：既存の資産を更新
            const assetIndex = this.assets.findIndex(a => a.id === this.editingAssetId);
            if (assetIndex !== -1) {
                const existingAsset = this.assets[assetIndex];
                const newMonthlyContribution = parseFloat(document.getElementById('monthlyContribution').value) || 0;
                const newCurrentAmount = parseFloat(document.getElementById('currentAmount').value);
                this.assets[assetIndex] = {
                    ...existingAsset,
                    name: finalName || existingAsset.name,
                    type: assetType,
                    currency: currency,
                    baseCurrency: baseCurrency,
                    targetCurrency: targetCurrency,
                    isForex: isForex,
                    currentAmount: newCurrentAmount,
                    // 初期額が未設定の場合は現在の値を初期額とする（下位互換性）
                    initialAmount: existingAsset.initialAmount ?? newCurrentAmount,
                    monthlyContribution: newMonthlyContribution,
                    // 初期値が未設定の場合は現在の値を初期値とする（下位互換性）
                    originalMonthlyContribution: existingAsset.originalMonthlyContribution ?? newMonthlyContribution,
                    annualReturn: parseFloat(document.getElementById('annualReturn').value),
                    taxCategory: document.getElementById('taxCategory').value,
                    accessInfo: accessInfo,
                    manualFuturePrice: futurePrice ? parseFloat(futurePrice) : null,
                    updatedAt: new Date().toISOString()
                };
            }
            
            // 編集モードを終了
            this.editingAssetId = null;
            const submitButton = document.querySelector('#assetForm button[type="submit"]');
            submitButton.textContent = '資産を追加';
            submitButton.style.background = '#3498db';
            
        } else {
            // 新規追加モード
            const monthlyContribution = parseFloat(document.getElementById('monthlyContribution').value) || 0;
            const currentAmount = parseFloat(document.getElementById('currentAmount').value);
            const asset = {
                id: Date.now(),
                name: finalName,
                type: assetType,
                currency: currency,
                baseCurrency: baseCurrency, // 積立通貨
                targetCurrency: targetCurrency, // 投資対象通貨
                isForex: isForex,
                currentAmount: currentAmount,
                initialAmount: currentAmount, // 初期額を保存
                monthlyContribution: monthlyContribution,
                originalMonthlyContribution: monthlyContribution, // 初期設定値を保存
                annualReturn: parseFloat(document.getElementById('annualReturn').value),
                taxCategory: document.getElementById('taxCategory').value,
                accessInfo: accessInfo, // アクセス情報
                manualFuturePrice: futurePrice ? parseFloat(futurePrice) : null,
                createdAt: new Date().toISOString()
            };

            this.assets.push(asset);
        }
        
        this.saveAssets();
        
        // 強制的にすべての表示を更新
        setTimeout(() => {
            this.updateDashboard();
            this.updateAssetList();
            this.updatePrediction();
            this.updateInheritanceStatus();
        }, 50);
        
        // フォームリセット
        document.getElementById('assetForm').reset();
        
        // アクセス情報がある場合のしろくまメッセージ
        let notification = isEditing ? '資産が更新されました！' : '資産が追加されました！';
        if (accessInfo.institutionName || accessInfo.loginId) {
            notification += ' できれば万一に備えて二段階認証のコードは共有しておくとよいのa🐻‍❄️';
        }
        
        this.showNotification(notification);
    }

    removeAsset(id) {
        if (confirm('この資産を削除しますか？')) {
            this.assets = this.assets.filter(asset => asset.id !== id);
            this.saveAssets();
            
            // 強制的にすべての表示を更新
            setTimeout(() => {
                this.updateDashboard();
                this.updateAssetList();
                this.updatePrediction();
                this.updateInheritanceStatus();
            }, 50);
            
            this.showNotification('資産が削除されました。');
        }
    }

    convertToJPY(amount, currency) {
        return amount * this.exchangeRates[currency];
    }

    getTotalValueInJPY() {
        return this.assets.reduce((total, asset) => {
            return total + this.convertToJPY(asset.currentAmount, asset.currency);
        }, 0);
    }

    calculateFutureValue(asset, years) {
        // 手動入力の将来価格がある場合はそれを使用（年数に関係なく）
        if (asset.manualFuturePrice) {
            // 手動設定価格を年数に応じて調整
            return asset.manualFuturePrice * Math.pow(1 + (asset.annualReturn / 100), years - 10);
        }
        
        const monthlyRate = asset.annualReturn / 100 / 12;
        const totalMonths = years * 12;
        
        // 外国為替の場合の特別計算（円建て積立→外貨運用）
        if (asset.isForex && asset.baseCurrency === 'JPY' && asset.targetCurrency !== 'JPY') {
            return this.calculateForexFutureValueInJPY(asset, years);
        }
        
        // 現在価値の複利計算
        const futureCurrentValue = asset.currentAmount * Math.pow(1 + asset.annualReturn / 100, years);
        
        // 積立投資の複利計算（月額投資がある場合のみ）
        let futureContributions = 0;
        if (asset.monthlyContribution > 0 && monthlyRate > 0) {
            futureContributions = asset.monthlyContribution * 
                ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
        } else if (asset.monthlyContribution > 0) {
            // 利回りが0の場合は単純積算
            futureContributions = asset.monthlyContribution * totalMonths;
        }
        
        return futureCurrentValue + futureContributions;
    }
    
    calculateForexFutureValue(asset, years) {
        // 外国為替専用計算：円建て積立 → 外貨建て資産（外貨ベース）
        const monthlyRate = asset.annualReturn / 100 / 12;
        const totalMonths = years * 12;
        const currentRate = this.exchangeRates[asset.targetCurrency];
        
        // 現在の外貨資産価値（外貨建て）
        let futureCurrentValue = asset.currentAmount * Math.pow(1 + asset.annualReturn / 100, years);
        
        // 月次積立の計算
        let futureContributions = 0;
        if (asset.monthlyContribution > 0) {
            // 円建て積立を現在レートで外貨換算
            const monthlyContributionInForeignCurrency = asset.monthlyContribution / currentRate;
            
            if (monthlyRate > 0) {
                futureContributions = monthlyContributionInForeignCurrency * 
                    ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
            } else {
                futureContributions = monthlyContributionInForeignCurrency * totalMonths;
            }
        }
        
        return futureCurrentValue + futureContributions;
    }

    calculateForexFutureValueInJPY(asset, years) {
        // 外国為替資産の将来価値を円建てで計算
        const currentRate = this.exchangeRates[asset.targetCurrency];
        const monthlyRate = asset.annualReturn / 100 / 12;
        const totalMonths = years * 12;
        
        // 現在の外貨資産を円換算した価値の成長
        const currentValueInJPY = asset.currentAmount * currentRate;
        const futureCurrentValueInJPY = currentValueInJPY * Math.pow(1 + asset.annualReturn / 100, years);
        
        // 月次積立の将来価値（円建て）
        let futureContributionsInJPY = 0;
        if (asset.monthlyContribution > 0) {
            if (monthlyRate > 0) {
                // 円建て積立の複利計算（外貨運用利回り適用）
                futureContributionsInJPY = asset.monthlyContribution * 
                    ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
            } else {
                // 利回り0の場合は単純積算
                futureContributionsInJPY = asset.monthlyContribution * totalMonths;
            }
        }
        
        // 為替リスクを考慮（将来の為替レートは現在レートと同じと仮定）
        return futureCurrentValueInJPY + futureContributionsInJPY;
    }
    
    calculateTaxOnGains(asset, grossGain, years = null) {
        // 課税区分に応じた税金計算
        switch (asset.taxCategory) {
            case '非課税':
                return 0; // NISA等は非課税
                
            case '総合':
                // 総合課税：最高税率55%（所得税45%＋住民税10%）を想定
                // 実際は所得水準により変動するが、ここでは簡易計算
                if (grossGain <= 200000) {
                    return grossGain * 0.20; // 20万円以下は20%
                } else if (grossGain <= 5000000) {
                    return grossGain * 0.30; // 500万円以下は30%
                } else {
                    return grossGain * 0.45; // 500万円超は45%
                }
                
            case '雑所得':
                // 雑所得：年毎に20万円控除を適用する改良版計算
                return this.calculateMiscellaneousIncomeTax(asset, grossGain, years);
                
            default:
                return 0;
        }
    }
    
    calculateMiscellaneousIncomeTax(asset, totalGrossGain, years) {
        // 雑所得の年毎分割税額計算
        if (!years || years <= 0) {
            // 年数が指定されていない場合は従来の方式
            if (totalGrossGain <= 200000) {
                return 0; // 20万円以下は申告不要
            } else if (totalGrossGain <= 5000000) {
                return totalGrossGain * 0.30; // 500万円以下は30%
            } else {
                return totalGrossGain * 0.45; // 500万円超は45%
            }
        }
        
        // 年毎の利益を計算して、各年で20万円控除を適用
        let totalTax = 0;
        let currentValue = asset.currentAmount;
        const annualReturn = asset.annualReturn / 100;
        const monthlyContribution = asset.monthlyContribution || 0;
        
        for (let year = 1; year <= years; year++) {
            // 各年の開始時価値
            const startValue = currentValue;
            
            // 年間投資額（月額×12ヶ月）
            const annualInvestment = monthlyContribution * 12;
            
            // 年末時価値（投資元本 + 運用益）
            const endValue = (startValue + annualInvestment) * (1 + annualReturn);
            
            // 年間利益（運用益のみ、投資元本は除外）
            const annualGain = endValue - startValue - annualInvestment;
            
            // 20万円控除後の課税対象額
            let taxableGain = Math.max(0, annualGain - 200000);
            
            // 税額計算（簡易版：所得水準により変動するが固定税率で計算）
            let annualTax = 0;
            if (taxableGain > 0) {
                if (taxableGain <= 3000000) {
                    annualTax = taxableGain * 0.30; // 300万円以下は30%
                } else {
                    annualTax = taxableGain * 0.45; // 300万円超は45%
                }
            }
            
            totalTax += annualTax;
            currentValue = endValue;
        }
        
        return totalTax;
    }
    
    calculateNetFutureValue(asset, years) {
        // 税引き後の将来価値計算
        const grossFutureValue = this.calculateFutureValue(asset, years);
        const grossGain = grossFutureValue - asset.currentAmount;
        
        if (grossGain <= 0) {
            return grossFutureValue; // 損失の場合は税金なし
        }
        
        const tax = this.calculateTaxOnGains(asset, grossGain, years);
        return grossFutureValue - tax;
    }

    updateDashboard() {
        const totalValue = this.getTotalValueInJPY();
        document.getElementById('totalValue').textContent = 
            `¥${totalValue.toLocaleString('ja-JP', {maximumFractionDigits: 0})}`;

        const summaryDiv = document.getElementById('assetSummary');
        if (this.assets.length === 0) {
            summaryDiv.innerHTML = '<p>まだ資産が登録されていません。</p>';
        } else {
            const summary = this.assets.map(asset => {
                const jpyValue = this.convertToJPY(asset.currentAmount, asset.currency);
                let detailText = `${asset.currency} ${asset.currentAmount.toLocaleString()}`;
                
                if (asset.isForex) {
                    detailText += ` | 円建て月額: ¥${asset.monthlyContribution.toLocaleString()}`;
                } else {
                    detailText += ` | 月額: ${asset.currency} ${asset.monthlyContribution.toLocaleString()}`;
                }
                
                // 課税区分アイコン追加
                const taxIcon = asset.taxCategory === '非課税' ? '🔰' : 
                               asset.taxCategory === '総合' ? '💰' : 
                               asset.taxCategory === '雑所得' ? '📊' : '❓';
                detailText += ` | ${taxIcon}${asset.taxCategory || '未設定'}`;
                
                return `<div class="asset-item">
                    <div class="asset-info">
                        <div class="asset-name">${asset.name} [${asset.type || '未分類'}]${asset.isForex ? ' 🌍' : ''}</div>
                        <div class="asset-details">${detailText}</div>
                    </div>
                    <div class="asset-value">¥${jpyValue.toLocaleString('ja-JP', {maximumFractionDigits: 0})}</div>
                </div>`;
            }).join('');
            summaryDiv.innerHTML = summary;
        }
    }

    updateAssetList() {
        const listDiv = document.getElementById('assetList');
        if (this.assets.length === 0) {
            listDiv.innerHTML = '<p>まだ資産が登録されていません。</p>';
            return;
        }

        const assetListHTML = this.assets.map(asset => {
            const jpyValue = this.convertToJPY(asset.currentAmount, asset.currency);
            const futurePredict = asset.manualFuturePrice ? '(手動設定)' : '';
            const hasAccessInfo = asset.accessInfo && (asset.accessInfo.institutionName || asset.accessInfo.loginId);
            
            let monthlyText;
            if (asset.isForex) {
                monthlyText = `円建て月額: ¥${asset.monthlyContribution.toLocaleString()}`;
            } else {
                monthlyText = `月額: ${asset.currency} ${asset.monthlyContribution.toLocaleString()}`;
            }
            
            // 課税区分アイコン
            const taxIcon = asset.taxCategory === '非課税' ? '🔰' : 
                           asset.taxCategory === '総合' ? '💰' : 
                           asset.taxCategory === '雑所得' ? '📊' : '❓';
            
            return `
                <div class="asset-item" style="border-left: 4px solid ${hasAccessInfo ? '#27ae60' : '#27ae60'};">
                    <div class="asset-info">
                        <div class="asset-name">
                            ${asset.name} [${asset.type || '未分類'}]${asset.isForex ? ' 🌍' : ''} ${taxIcon}
                            ${hasAccessInfo ? ' 🔐' : ' 🟢'}
                        </div>
                        <div class="asset-details">
                            ${asset.currency} ${asset.currentAmount.toLocaleString()} 
                            | ${monthlyText}
                            | 利回り: ${asset.annualReturn}% ${futurePredict}
                        </div>
                        ${hasAccessInfo ? `
                            <div style="font-size: 0.85em; color: #7f8c8d; margin-top: 5px;">
                                🔐 取扱先: ${asset.accessInfo.institutionName || '未設定'} | 
                                二段階認証: ${asset.accessInfo.twoFactorAuth || 'なし'}
                            </div>
                        ` : `
                            <div style="font-size: 0.85em; color: #27ae60; margin-top: 5px;">
                                🟢 相続情報がないぞい🐻‍❄️
                            </div>
                        `}
                    </div>
                    <div style="text-align: right;">
                        <div class="asset-value">¥${jpyValue.toLocaleString('ja-JP', {maximumFractionDigits: 0})}</div>
                        <div style="margin-top: 10px;">
                            <button class="btn" style="padding: 8px 12px; font-size: 0.9em; margin-right: 5px;" onclick="assetManager.editAsset(${asset.id})">編集</button>
                            <button class="btn btn-danger" style="padding: 8px 12px; font-size: 0.9em;" onclick="assetManager.removeAsset(${asset.id})">削除</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        listDiv.innerHTML = assetListHTML;
    }

    updatePrediction() {
        const yearsElement = document.getElementById('predictionYears');
        const displayModeElement = document.getElementById('displayMode');
        
        if (!yearsElement) {
            console.error('predictionYears element not found');
            return;
        }
        
        const years = parseInt(yearsElement.value);
        const displayMode = displayModeElement ? displayModeElement.value : 'both';
        const resultDiv = document.getElementById('predictionResult');
        
        if (!resultDiv) {
            console.error('predictionResult element not found');
            return;
        }
        
        console.log('予測を更新中:', years + '年後, 表示モード:', displayMode);
        
        if (this.assets.length === 0) {
            resultDiv.innerHTML = '予測を表示するには資産を追加してください。';
            // 資産がない場合もグラフを更新（デフォルト表示）
            this.drawGrowthChart(years, displayMode);
            return;
        }

        let totalGrossFutureValue = 0;
        let totalNetFutureValue = 0;
        let totalTax = 0;
        let predictionHTML = '<div style="text-align: left;">';
        
        this.assets.forEach(asset => {
            const grossFutureValue = this.calculateFutureValue(asset, years);
            const netFutureValue = this.calculateNetFutureValue(asset, years);
            const grossFutureValueJPY = this.convertToJPY(grossFutureValue, asset.currency);
            const netFutureValueJPY = this.convertToJPY(netFutureValue, asset.currency);
            const taxJPY = grossFutureValueJPY - netFutureValueJPY;
            
            totalGrossFutureValue += grossFutureValueJPY;
            totalNetFutureValue += netFutureValueJPY;
            totalTax += taxJPY;
            
            const isManual = asset.manualFuturePrice ? ' (手動設定ベース)' : '';
            let monthlyInvestText;
            if (asset.isForex) {
                monthlyInvestText = `円建て月額投資: ¥${asset.monthlyContribution.toLocaleString()}`;
            } else {
                monthlyInvestText = `月額投資: ${asset.currency} ${asset.monthlyContribution.toLocaleString()}`;
            }
            
            // 課税区分アイコン
            const taxIcon = asset.taxCategory === '非課税' ? '🔰' : 
                           asset.taxCategory === '総合' ? '💰' : 
                           asset.taxCategory === '雑所得' ? '📊' : '❓';
            
            predictionHTML += `
                <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid ${asset.taxCategory === '非課税' ? '#27ae60' : asset.taxCategory === '総合' ? '#f39c12' : '#e74c3c'};">
                    <strong>${asset.name} [${asset.type || '未分類'}]${asset.isForex ? ' 🌍' : ''} ${taxIcon}</strong><br>
                    現在: ${asset.currency} ${asset.currentAmount.toLocaleString()}<br>
                    ${monthlyInvestText}<br>`;
            
            if (displayMode === 'both' || displayMode === 'gross') {
                predictionHTML += `
                    <div style="color: #2ecc71; font-weight: bold;">
                        純粋成長${years}年後: ${asset.currency} ${grossFutureValue.toLocaleString('ja-JP', {maximumFractionDigits: 0})}${isManual}<br>
                        (JPY換算: ¥${grossFutureValueJPY.toLocaleString('ja-JP', {maximumFractionDigits: 0})})
                    </div>`;
            }
            
            if (displayMode === 'both' || displayMode === 'net') {
                predictionHTML += `
                    <div style="color: #3498db; font-weight: bold;">
                        課税後${years}年後: ${asset.currency} ${netFutureValue.toLocaleString('ja-JP', {maximumFractionDigits: 0})}<br>
                        (JPY換算: ¥${netFutureValueJPY.toLocaleString('ja-JP', {maximumFractionDigits: 0})})
                    </div>`;
            }
            
            if (displayMode === 'both' && taxJPY > 0) {
                predictionHTML += `
                    <div style="color: #e74c3c; font-size: 0.9em;">
                        予想税額: ¥${taxJPY.toLocaleString('ja-JP', {maximumFractionDigits: 0})}
                    </div>`;
            }
            
            predictionHTML += '</div>';
        });
        
        // 総合計表示
        if (displayMode === 'both') {
            predictionHTML += `
                <div style="margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #2ecc71, #3498db); color: white; border-radius: 8px; text-align: center;">
                    <h3>${years}年後の総資産予測比較</h3>
                    <div style="display: flex; justify-content: space-around; flex-wrap: wrap; margin-top: 15px;">
                        <div style="text-align: center; min-width: 200px;">
                            <div style="font-size: 0.9em; opacity: 0.9;">純粋成長</div>
                            <div style="font-size: 1.3em; font-weight: bold;">
                                ¥${totalGrossFutureValue.toLocaleString('ja-JP', {maximumFractionDigits: 0})}
                            </div>
                        </div>
                        <div style="text-align: center; min-width: 200px;">
                            <div style="font-size: 0.9em; opacity: 0.9;">課税後実質</div>
                            <div style="font-size: 1.3em; font-weight: bold;">
                                ¥${totalNetFutureValue.toLocaleString('ja-JP', {maximumFractionDigits: 0})}
                            </div>
                        </div>
                        <div style="text-align: center; min-width: 200px;">
                            <div style="font-size: 0.9em; opacity: 0.9;">税額合計</div>
                            <div style="font-size: 1.1em; font-weight: bold;">
                                ¥${totalTax.toLocaleString('ja-JP', {maximumFractionDigits: 0})}
                            </div>
                        </div>
                    </div>
                </div>`;
        } else if (displayMode === 'gross') {
            predictionHTML += `
                <div style="margin-top: 20px; padding: 20px; background: #2ecc71; color: white; border-radius: 8px; text-align: center;">
                    <h3>${years}年後の総資産予測（純粋成長）</h3>
                    <div style="font-size: 1.5em; font-weight: bold;">
                        ¥${totalGrossFutureValue.toLocaleString('ja-JP', {maximumFractionDigits: 0})}
                    </div>
                </div>`;
        } else {
            predictionHTML += `
                <div style="margin-top: 20px; padding: 20px; background: #3498db; color: white; border-radius: 8px; text-align: center;">
                    <h3>${years}年後の総資産予測（課税後実質）</h3>
                    <div style="font-size: 1.5em; font-weight: bold;">
                        ¥${totalNetFutureValue.toLocaleString('ja-JP', {maximumFractionDigits: 0})}
                    </div>
                </div>`;
        }
        
        predictionHTML += '</div>';
        resultDiv.innerHTML = predictionHTML;
        
        // 成長グラフを描画
        this.drawGrowthChart(years, displayMode);
        
        console.log('予測更新完了:', years + '年後, 純粋:', totalGrossFutureValue, '課税後:', totalNetFutureValue);
    }
    
    drawGrowthChart(maxYears, displayMode = 'both') {
        const canvas = document.getElementById('growthChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // キャンバスをクリア
        ctx.clearRect(0, 0, width, height);
        
        if (this.assets.length === 0) {
            ctx.fillStyle = '#7f8c8d';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('資産を追加すると成長グラフが表示されます', width / 2, height / 2);
            return;
        }
        
        // データ計算
        const yearStep = Math.max(1, Math.floor(maxYears / 20)); // 最大20点でプロット
        const grossDataPoints = [];
        const netDataPoints = [];
        
        for (let year = 0; year <= maxYears; year += yearStep) {
            let totalGrossValue = 0;
            let totalNetValue = 0;
            
            this.assets.forEach(asset => {
                if (year === 0) {
                    const currentValue = this.convertToJPY(asset.currentAmount, asset.currency);
                    totalGrossValue += currentValue;
                    totalNetValue += currentValue;
                } else {
                    const grossFutureValue = this.calculateFutureValue(asset, year);
                    const netFutureValue = this.calculateNetFutureValue(asset, year);
                    totalGrossValue += this.convertToJPY(grossFutureValue, asset.currency);
                    totalNetValue += this.convertToJPY(netFutureValue, asset.currency);
                }
            });
            
            grossDataPoints.push({ year, value: totalGrossValue });
            netDataPoints.push({ year, value: totalNetValue });
        }
        
        // グラフ設定
        const padding = 60;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        const allValues = [...grossDataPoints.map(p => p.value), ...netDataPoints.map(p => p.value)];
        const maxValue = Math.max(...allValues);
        const minValue = Math.min(...allValues);
        const valueRange = maxValue - minValue || 1;
        
        // 背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // グリッド線
        ctx.strokeStyle = '#e9ecef';
        ctx.lineWidth = 1;
        
        // 縦軸グリッド
        for (let i = 0; i <= 10; i++) {
            const y = padding + (chartHeight * i / 10);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        
        // 横軸グリッド
        for (let i = 0; i <= 10; i++) {
            const x = padding + (chartWidth * i / 10);
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
        }
        
        // 純粋成長線
        if (displayMode === 'both' || displayMode === 'gross') {
            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            grossDataPoints.forEach((point, index) => {
                const x = padding + (chartWidth * point.year / maxYears);
                const y = height - padding - (chartHeight * (point.value - minValue) / valueRange);
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            
            // データポイント
            ctx.fillStyle = '#2ecc71';
            grossDataPoints.forEach(point => {
                const x = padding + (chartWidth * point.year / maxYears);
                const y = height - padding - (chartHeight * (point.value - minValue) / valueRange);
                
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
            });
        }
        
        // 課税後線
        if (displayMode === 'both' || displayMode === 'net') {
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 3;
            ctx.beginPath();
            
            netDataPoints.forEach((point, index) => {
                const x = padding + (chartWidth * point.year / maxYears);
                const y = height - padding - (chartHeight * (point.value - minValue) / valueRange);
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            
            // データポイント
            ctx.fillStyle = '#3498db';
            netDataPoints.forEach(point => {
                const x = padding + (chartWidth * point.year / maxYears);
                const y = height - padding - (chartHeight * (point.value - minValue) / valueRange);
                
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
            });
        }
        
        // 軸ラベル
        ctx.fillStyle = '#2c3e50';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        // X軸ラベル（年）
        for (let i = 0; i <= 5; i++) {
            const year = Math.floor(maxYears * i / 5);
            const x = padding + (chartWidth * i / 5);
            ctx.fillText(year + '年', x, height - 20);
        }
        
        // Y軸ラベル（金額）
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const value = minValue + (valueRange * i / 5);
            const y = height - padding - (chartHeight * i / 5);
            ctx.fillText('¥' + (value / 1000000).toFixed(1) + 'M', padding - 10, y + 4);
        }
        
        // タイトル
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        let chartTitle = '資産成長予測グラフ';
        if (displayMode === 'both') {
            chartTitle += '（純粋成長 vs 課税後成長）';
        } else if (displayMode === 'gross') {
            chartTitle += '（純粋成長）';
        } else {
            chartTitle += '（課税後成長）';
        }
        ctx.fillText(chartTitle, width / 2, 30);
        
        // 凡例
        if (displayMode === 'both') {
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            
            // 純粋成長凡例
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(width - 180, 50, 15, 3);
            ctx.fillStyle = '#2c3e50';
            ctx.fillText('純粋成長', width - 160, 58);
            
            // 課税後成長凡例
            ctx.fillStyle = '#3498db';
            ctx.fillRect(width - 180, 70, 15, 3);
            ctx.fillStyle = '#2c3e50';
            ctx.fillText('課税後成長', width - 160, 78);
        }
    }

    saveInheritanceSettings() {
        const settings = {
            emergencyEmail: document.getElementById('emergencyEmail').value,
            inactivityDays: parseInt(document.getElementById('inactivityDays').value),
            inheritanceMessage: document.getElementById('inheritanceMessage').value,
            isActive: true,
            createdAt: new Date().toISOString()
        };

        this.inheritanceSettings = settings;
        localStorage.setItem('inheritanceSettings', JSON.stringify(settings));
        
        this.updateInheritanceStatus();
        this.showNotification('相続設定が保存されました！');
    }
    
    
    editAsset(id) {
        const asset = this.assets.find(a => a.id === id);
        if (!asset) return;
        
        // フォームに既存の値を設定
        document.getElementById('assetType').value = asset.type || '';
        document.getElementById('assetName').value = asset.name || '';
        document.getElementById('currency').value = asset.currency || 'JPY';
        document.getElementById('currentAmount').value = asset.currentAmount || '';
        document.getElementById('monthlyContribution').value = asset.monthlyContribution || 0;
        document.getElementById('annualReturn').value = asset.annualReturn || '';
        document.getElementById('taxCategory').value = asset.taxCategory || '';
        document.getElementById('futurePrice').value = asset.manualFuturePrice || '';
        
        // アクセス情報の設定
        if (asset.accessInfo) {
            document.getElementById('institutionName').value = asset.accessInfo.institutionName || '';
            document.getElementById('contactInfo').value = asset.accessInfo.contactInfo || '';
            document.getElementById('loginId').value = asset.accessInfo.loginId || '';
            document.getElementById('password').value = asset.accessInfo.password || '';
            document.getElementById('twoFactorAuth').value = asset.accessInfo.twoFactorAuth || '';
            document.getElementById('accessNotes').value = asset.accessInfo.accessNotes || '';
        }
        
        // 外国為替フィールドの表示切り替え
        toggleForexFields();
        
        // 編集モードに設定
        this.editingAssetId = id;
        const submitButton = document.querySelector('#assetForm button[type="submit"]');
        submitButton.textContent = '変更を保存';
        submitButton.style.background = '#f39c12';
        
        // 資産管理タブに切り替え
        showSection('assets', document.querySelector('.nav-item[onclick*="assets"]'));
        
        // フォームまでスクロール
        document.getElementById('assetForm').scrollIntoView({ behavior: 'smooth' });
        
        this.showNotification('編集モードになりました。変更後に保存してください。');
    }
    
    generateInheritanceReport() {
        if (this.assets.length === 0) {
            this.showNotification('レポート生成には資産の登録が必要です。');
            return;
        }
        
        const totalValue = this.getTotalValueInJPY();
        const currentDate = new Date().toLocaleDateString('ja-JP');
        
        let report = `=== 資産相続レポート ===\n`;
        report += `作成日: ${currentDate}\n`;
        report += `総資産額: ¥${totalValue.toLocaleString('ja-JP', {maximumFractionDigits: 0})}\n\n`;
        
        report += `=== 資産一覧 ===\n`;
        this.assets.forEach((asset, index) => {
            const jpyValue = this.convertToJPY(asset.currentAmount, asset.currency);
            
            report += `\n${index + 1}. ${asset.name} [${asset.type}]\n`;
            report += `   資産額: ${asset.currency} ${asset.currentAmount.toLocaleString()} (¥${jpyValue.toLocaleString('ja-JP', {maximumFractionDigits: 0})})\n`;
            report += `   課税区分: ${asset.taxCategory}\n`;
            
            if (asset.accessInfo && asset.accessInfo.institutionName) {
                report += `   \n   --- アクセス情報 ---\n`;
                report += `   取扱先: ${asset.accessInfo.institutionName}\n`;
                report += `   連絡先: ${asset.accessInfo.contactInfo || '未設定'}\n`;
                report += `   ログインID: ${asset.accessInfo.loginId || '未設定'}\n`;
                report += `   パスワード: ${asset.accessInfo.password || '未設定'}\n`;
                report += `   二段階認証: ${asset.accessInfo.twoFactorAuth || 'なし'}\n`;
                if (asset.accessInfo.accessNotes) {
                    report += `   備考: ${asset.accessInfo.accessNotes}\n`;
                }
            } else {
                report += `   ⚠️ アクセス情報が未設定です\n`;
            }
        });
        
        report += `\n=== 注意事項 ===\n`;
        report += `- 二段階認証が設定されている場合は、認証コードの共有方法を確認してください\n`;
        report += `- パスワード等の重要情報は安全に管理してください\n`;
        report += `- 各金融機関の相続手続きについて事前に確認することをお勧めします\n`;
        
        // レポートをテキストファイルとしてダウンロード
        const blob = new Blob([report], { type: 'text/plain; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `相続レポート_${currentDate.replace(/\//g, '')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('相続レポートをダウンロードしました！できれば万一に備えて二段階認証のコードは共有しておくとよいのa🐻‍❄️');
    }

    updateInheritanceStatus() {
        const statusDiv = document.getElementById('inheritanceStatus');
        const infoDiv = document.getElementById('emergencyContactInfo');
        const settingsDiv = document.getElementById('currentSettings');
        
        if (this.inheritanceSettings.isActive) {
            statusDiv.innerHTML = `
                <span class="status-indicator status-active"></span>
                <span>相続機能：有効</span>
            `;
            
            infoDiv.style.display = 'block';
            settingsDiv.innerHTML = `
                <p><strong>緊急連絡先:</strong> ${this.inheritanceSettings.emergencyEmail}</p>
                <p><strong>無連絡期間:</strong> ${this.inheritanceSettings.inactivityDays}日</p>
            `;
            
            document.getElementById('lastCheckIn').textContent = 
                new Date(this.lastCheckIn).toLocaleString('ja-JP');
        } else {
            statusDiv.innerHTML = `
                <span class="status-indicator status-inactive"></span>
                <span>相続機能：未設定</span>
            `;
            infoDiv.style.display = 'none';
        }
    }

    checkIn() {
        this.lastCheckIn = new Date().toISOString();
        localStorage.setItem('lastCheckIn', this.lastCheckIn);
        this.updateInheritanceStatus();
        this.showNotification('生存確認が更新されました！');
    }

    checkInactivity() {
        if (!this.inheritanceSettings.isActive) return;
        
        const lastCheck = new Date(this.lastCheckIn);
        const now = new Date();
        const daysSinceLastCheck = (now - lastCheck) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLastCheck >= this.inheritanceSettings.inactivityDays) {
            this.triggerInheritanceProtocol();
        }
    }

    triggerInheritanceProtocol() {
        // 実際の実装では、ここでサーバーにメール送信リクエストを送信
        console.log('相続プロトコル発動');
        console.log('送信先:', this.inheritanceSettings.emergencyEmail);
        console.log('資産情報:', this.generateAssetReport());
        console.log('メッセージ:', this.inheritanceSettings.inheritanceMessage);
        
        // デモ用の通知
        this.showNotification('相続プロトコルがトリガーされました（デモモード）');
    }

    generateAssetReport() {
        const totalValue = this.getTotalValueInJPY();
        let report = `総資産額: ¥${totalValue.toLocaleString('ja-JP', {maximumFractionDigits: 0})}\n\n`;
        
        this.assets.forEach(asset => {
            const jpyValue = this.convertToJPY(asset.currentAmount, asset.currency);
            report += `${asset.name}: ${asset.currency} ${asset.currentAmount.toLocaleString()} (¥${jpyValue.toLocaleString('ja-JP', {maximumFractionDigits: 0})})\n`;
        });
        
        return report;
    }

    async updateExchangeRates() {
        try {
            this.showNotification('為替レートを取得中です...');
            
            // ExchangeRate-APIを使用してリアルタイムレートを取得（USDベース）
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            
            if (data && data.rates) {
                // USDベースからJPYベースに変換
                const usdToJpy = data.rates.JPY;
                this.exchangeRates.USD = usdToJpy;
                this.exchangeRates.AUD = data.rates.JPY / data.rates.AUD;
                this.exchangeRates.EUR = data.rates.JPY / data.rates.EUR;
                this.exchangeRates.JPY = 1.00;
                
                localStorage.setItem('exchangeRates', JSON.stringify(this.exchangeRates));
                
                // 強制的にすべての表示を更新
                setTimeout(() => {
                    this.updateExchangeRateDisplay();
                    this.updateDashboard();
                    this.updateAssetList();
                    this.updatePrediction();
                }, 50);
                
                this.showNotification('リアルタイム為替レートを更新しました！');
            } else {
                throw new Error('データ取得に失敗');
            }
        } catch (error) {
            console.error('為替レート取得エラー:', error);
            // フォールバック：ランダム更新
            this.exchangeRates.USD = 145 + Math.random() * 10;
            this.exchangeRates.AUD = 95 + Math.random() * 10;
            this.exchangeRates.EUR = 155 + Math.random() * 10;
            
            localStorage.setItem('exchangeRates', JSON.stringify(this.exchangeRates));
            
            // 強制的にすべての表示を更新
            setTimeout(() => {
                this.updateExchangeRateDisplay();
                this.updateDashboard();
                this.updateAssetList();
                this.updatePrediction();
            }, 50);
            
            this.showNotification('デモレートで更新しました（API接続失敗）');
        }
    }

    updateExchangeRateDisplay() {
        console.log('為替レート表示更新:', this.exchangeRates);
        
        const usdElement = document.getElementById('usdRate');
        const audElement = document.getElementById('audRate');
        const eurElement = document.getElementById('eurRate');
        
        if (usdElement) usdElement.textContent = this.exchangeRates.USD.toFixed(2);
        if (audElement) audElement.textContent = this.exchangeRates.AUD.toFixed(2);
        if (eurElement) eurElement.textContent = this.exchangeRates.EUR.toFixed(2);
        
        console.log('為替レート表示更新完了');
    }

    exportData() {
        const data = {
            assets: this.assets,
            inheritanceSettings: this.inheritanceSettings,
            exchangeRates: this.exchangeRates,
            lastCheckIn: this.lastCheckIn,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `asset-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('データがエクスポートされました！');
    }

    clearAllData() {
        if (confirm('本当にすべてのデータを削除しますか？この操作は取り消せません。')) {
            localStorage.clear();
            this.assets = [];
            this.inheritanceSettings = {};
            this.exchangeRates = { USD: 150.00, AUD: 100.00, EUR: 160.00, JPY: 1.00 };
            this.lastCheckIn = new Date().toISOString();
            this.lastMonthlyUpdate = null;
            this.updateHistory = [];
            
            // 表示を明示的に更新
            this.updateDashboard();
            this.updateAssetList();
            this.updatePrediction(); // グラフも含めて更新
            this.updateInheritanceStatus();
            this.updateExchangeRateDisplay();
            this.updateMonthlyUpdateDisplay();
            this.updateAssetAdjustmentPanel();
            
            this.showNotification('すべてのデータが削除されました。');
        }
    }

    saveAssets() {
        localStorage.setItem('assets', JSON.stringify(this.assets));
    }

    getRandomWelcomeMessage() {
        return this.welcomeMessages[Math.floor(Math.random() * this.welcomeMessages.length)];
    }

    showNotification(message) {
        // しろくまコメント付きの通知システム
        const polarBearMessage = this.getRandomWelcomeMessage();
        const notification = document.createElement('div');
        notification.className = 'notification';
        
        // モバイル対応のスタイル
        const isMobile = window.innerWidth <= 768;
        notification.style.cssText = `
            position: fixed;
            ${isMobile ? 'top: 10px; left: 10px; right: 10px; max-width: none;' : 'top: 20px; right: 20px; max-width: 300px;'}
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            font-weight: 600;
        `;
        notification.innerHTML = `
            <div>${message}</div>
            <div style="margin-top: 8px; font-size: 0.9em; opacity: 0.9;">${polarBearMessage}</div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    // 月次更新関連のメソッド
    checkMonthlyUpdate() {
        if (!this.lastMonthlyUpdate) return;
        
        const lastUpdate = new Date(this.lastMonthlyUpdate);
        const now = new Date();
        
        // 月末判定（翌月の1日以降かどうか）
        const nextMonth = new Date(lastUpdate.getFullYear(), lastUpdate.getMonth() + 1, 1);
        
        if (now >= nextMonth && this.assets.length > 0) {
            this.showNotification('月次更新が可能です。資産額の更新を検討してください。');
        }
    }

    updateMonthlyUpdateDisplay() {
        const lastUpdateElement = document.getElementById('lastUpdateDate');
        const undoButton = document.getElementById('undoButton');
        
        if (lastUpdateElement) {
            if (this.lastMonthlyUpdate) {
                const date = new Date(this.lastMonthlyUpdate);
                lastUpdateElement.textContent = date.toLocaleDateString('ja-JP');
            } else {
                lastUpdateElement.textContent = '未実行';
            }
        }
        
        // 取り消しボタンの有効/無効を設定
        if (undoButton) {
            // 24時間以内の更新履歴があるかチェック
            const recentUpdates = this.getRecentUpdates();
            if (recentUpdates.length > 0) {
                undoButton.disabled = false;
                undoButton.style.opacity = '1';
                undoButton.textContent = `↩️ 追加分を戻す (${recentUpdates.length}回分)`;
            } else {
                undoButton.disabled = true;
                undoButton.style.opacity = '0.5';
                undoButton.textContent = '↩️ 追加分を戻す';
            }
        }
    }

    getRecentUpdates() {
        const now = new Date();
        return this.updateHistory.filter(update => {
            const updateDate = new Date(update.timestamp);
            const hoursSinceUpdate = (now - updateDate) / (1000 * 60 * 60);
            return hoursSinceUpdate <= 24;
        });
    }

    performMonthlyUpdate() {
        if (this.assets.length === 0) {
            this.showNotification('更新する資産がありません。');
            return;
        }

        // 更新前のスナップショットを保存
        const beforeSnapshot = JSON.parse(JSON.stringify(this.assets));
        
        let updatedAssets = [];
        this.assets.forEach(asset => {
            if (asset.monthlyContribution > 0) {
                asset.currentAmount += asset.monthlyContribution;
                updatedAssets.push({
                    id: asset.id,
                    name: asset.name,
                    addedAmount: asset.monthlyContribution,
                    currency: asset.currency
                });
            }
        });

        if (updatedAssets.length > 0) {
            // 履歴に追加
            const updateRecord = {
                timestamp: new Date().toISOString(),
                beforeSnapshot: beforeSnapshot,
                afterSnapshot: JSON.parse(JSON.stringify(this.assets)),
                updatedAssets: updatedAssets
            };
            
            this.updateHistory.push(updateRecord);
            this.lastMonthlyUpdate = updateRecord.timestamp;
            
            // 古い履歴（48時間以上前）は削除
            this.cleanupOldHistory();
            
            localStorage.setItem('updateHistory', JSON.stringify(this.updateHistory));
            localStorage.setItem('lastMonthlyUpdate', this.lastMonthlyUpdate);
            this.saveAssets();
            
            // 表示を更新
            this.updateDashboard();
            this.updateAssetList();
            this.updatePrediction();
            this.updateMonthlyUpdateDisplay();
            this.updateAssetAdjustmentPanel();
            
            this.showNotification(`${updatedAssets.length}件の資産に積立額が追加されました！24時間以内なら「追加分を戻す」で取り消し可能です。`);
        } else {
            this.showNotification('積立設定のある資産がありません。');
        }
    }

    cleanupOldHistory() {
        const now = new Date();
        this.updateHistory = this.updateHistory.filter(update => {
            const updateDate = new Date(update.timestamp);
            const hoursSinceUpdate = (now - updateDate) / (1000 * 60 * 60);
            return hoursSinceUpdate <= 48; // 48時間以内の履歴のみ保持
        });
    }

    undoMonthlyUpdate() {
        const recentUpdates = this.getRecentUpdates();
        
        if (recentUpdates.length === 0) {
            this.showNotification('取り消し可能な更新がありません。');
            return;
        }

        // 最新の更新を取り消し
        const lastUpdate = recentUpdates[recentUpdates.length - 1];
        
        // 更新前の状態に復元
        this.assets = JSON.parse(JSON.stringify(lastUpdate.beforeSnapshot));
        this.saveAssets();

        // 履歴から該当の更新を削除
        const updateIndex = this.updateHistory.findIndex(update => 
            update.timestamp === lastUpdate.timestamp
        );
        if (updateIndex !== -1) {
            this.updateHistory.splice(updateIndex, 1);
        }

        // 最後の更新日を更新
        if (this.updateHistory.length > 0) {
            this.lastMonthlyUpdate = this.updateHistory[this.updateHistory.length - 1].timestamp;
        } else {
            this.lastMonthlyUpdate = null;
        }

        localStorage.setItem('updateHistory', JSON.stringify(this.updateHistory));
        localStorage.setItem('lastMonthlyUpdate', this.lastMonthlyUpdate);

        // 表示を更新
        this.updateDashboard();
        this.updateAssetList();
        this.updatePrediction();
        this.updateMonthlyUpdateDisplay();
        this.updateAssetAdjustmentPanel();

        const undoCount = recentUpdates.length - 1;
        this.showNotification(`積立額の追加を取り消したの🐻‍❄️${undoCount > 0 ? ` (残り${undoCount}回分取り消し可能)` : ''}`);
    }

    updateAssetAdjustmentPanel() {
        const panel = document.getElementById('assetAdjustmentPanel');
        const listDiv = document.getElementById('assetAdjustmentList');
        
        if (this.assets.length === 0) {
            panel.style.display = 'none';
            return;
        }
        
        panel.style.display = 'block';
        
        const adjustmentHTML = this.assets.map(asset => {
            const jpyValue = this.convertToJPY(asset.currentAmount, asset.currency);
            
            return `
                <div class="asset-adjustment-item">
                    <div class="asset-info">
                        <div class="asset-name">${asset.name} [${asset.type || '未分類'}]</div>
                        <div class="asset-details">
                            現在額: ${asset.currency} ${asset.currentAmount.toLocaleString()} 
                            | 月額: ${asset.currency} ${asset.monthlyContribution.toLocaleString()}
                        </div>
                    </div>
                    <div class="adjustment-controls">
                        <div style="margin-right: 15px;">
                            <div style="font-size: 0.9em; color: #7f8c8d; margin-bottom: 5px;">現在額調整 (月額単位)</div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <button class="arrow-btn" onclick="adjustAssetAmount(${asset.id}, 'current', -${asset.monthlyContribution})">←</button>
                                <input type="number" class="editable-amount" id="current_${asset.id}" 
                                       value="${asset.currentAmount}" 
                                       onblur="updateAssetAmount(${asset.id}, 'current', this.value)"
                                       step="0.01">
                                <button class="arrow-btn increase" onclick="adjustAssetAmount(${asset.id}, 'current', ${asset.monthlyContribution})">→</button>
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 0.9em; color: #7f8c8d; margin-bottom: 5px;">月額調整 (千円単位)</div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <button class="arrow-btn" onclick="adjustAssetAmount(${asset.id}, 'monthly', -1000)">←</button>
                                <input type="number" class="editable-amount" id="monthly_${asset.id}" 
                                       value="${asset.monthlyContribution}" 
                                       onblur="updateAssetAmount(${asset.id}, 'monthly', this.value)"
                                       step="0.01">
                                <button class="arrow-btn increase" onclick="adjustAssetAmount(${asset.id}, 'monthly', 1000)">→</button>
                                ${(asset.originalMonthlyContribution !== undefined && asset.monthlyContribution !== asset.originalMonthlyContribution) ? 
                                    `<button class="btn" style="font-size: 0.8em; padding: 6px 10px; margin-left: 5px;" onclick="resetMonthlyContribution(${asset.id})">🔄 初期値</button>` : ''
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        listDiv.innerHTML = adjustmentHTML;
    }

    adjustAssetAmount(assetId, type, adjustment) {
        const asset = this.assets.find(a => a.id === assetId);
        if (!asset) return;

        if (type === 'current') {
            asset.currentAmount = Math.max(0, asset.currentAmount + adjustment);
            document.getElementById(`current_${assetId}`).value = asset.currentAmount;
        } else if (type === 'monthly') {
            asset.monthlyContribution = Math.max(0, asset.monthlyContribution + adjustment);
            document.getElementById(`monthly_${assetId}`).value = asset.monthlyContribution;
        }

        this.saveAssets();
        this.updateDashboard();
        this.updateAssetList();
        this.updatePrediction();
        // 月額が変更された場合は調整パネルも更新（現在額の矢印ボタンの値が変わるため）
        if (type === 'monthly') {
            this.updateAssetAdjustmentPanel();
        }
    }

    updateAssetAmount(assetId, type, newValue) {
        const asset = this.assets.find(a => a.id === assetId);
        if (!asset) return;

        const value = Math.max(0, parseFloat(newValue) || 0);
        
        if (type === 'current') {
            asset.currentAmount = value;
        } else if (type === 'monthly') {
            asset.monthlyContribution = value;
        }

        this.saveAssets();
        this.updateDashboard();
        this.updateAssetList();
        this.updatePrediction();
        this.updateAssetAdjustmentPanel(); // リセットボタンの表示状態を更新
    }

    resetMonthlyContribution(assetId) {
        const asset = this.assets.find(a => a.id === assetId);
        if (!asset || asset.originalMonthlyContribution === undefined) return;

        asset.monthlyContribution = asset.originalMonthlyContribution;
        document.getElementById(`monthly_${assetId}`).value = asset.originalMonthlyContribution;

        this.saveAssets();
        this.updateDashboard();
        this.updateAssetList();
        this.updatePrediction();
        this.updateAssetAdjustmentPanel();

        this.showNotification(`${asset.name}の積立額を初期値に戻したの🐻‍❄️`);
    }

    resetAllAssets() {
        if (this.assets.length === 0) {
            this.showNotification('リセットする資産がありません。');
            return;
        }

        const confirmMessage = `全ての資産を初期状態にリセットしますか？

以下が実行されます：
• 全ての現在額を作成時の初期額に戻す
• 全ての積立額を作成時の設定に戻す
• 月次更新履歴をクリア

この操作は取り消せません。`;

        if (confirm(confirmMessage)) {
            let resetCount = 0;
            
            this.assets.forEach(asset => {
                // 初期額が記録されている場合のみリセット（下位互換性）
                const hasInitialAmount = asset.initialAmount !== undefined;
                const hasInitialMonthly = asset.originalMonthlyContribution !== undefined;
                
                if (hasInitialAmount) {
                    asset.currentAmount = asset.initialAmount;
                    resetCount++;
                }
                
                if (hasInitialMonthly) {
                    asset.monthlyContribution = asset.originalMonthlyContribution;
                }
            });

            // 月次更新履歴をクリア
            this.updateHistory = [];
            this.lastMonthlyUpdate = null;
            localStorage.removeItem('updateHistory');
            localStorage.removeItem('lastMonthlyUpdate');

            this.saveAssets();
            
            // 表示を更新
            this.updateDashboard();
            this.updateAssetList();
            this.updatePrediction();
            this.updateMonthlyUpdateDisplay();
            this.updateAssetAdjustmentPanel();

            if (resetCount > 0) {
                this.showNotification(`${this.assets.length}件の資産を初期状態にリセットしたの🐻‍❄️`);
            } else {
                this.showNotification('リセット可能なデータがありませんでした。');
            }
        }
    }
}

// ナビゲーション機能
function showSection(sectionId, clickedElement) {
    // すべてのセクションを非表示
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // すべてのナビアイテムの active クラスを削除
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 選択されたセクションを表示
    document.getElementById(sectionId).classList.add('active');
    
    // 対応するナビアイテムに active クラスを追加
    if (clickedElement) {
        clickedElement.classList.add('active');
    }
    
    // 予測ページが表示された場合、予測を更新
    if (sectionId === 'prediction' && window.assetManager) {
        setTimeout(() => {
            assetManager.updatePrediction();
        }, 100);
    }
}

// 予測更新関数
function updatePrediction() {
    console.log('グローバルupdatePrediction呼び出し');
    if (window.assetManager) {
        console.log('assetManager存在確認OK');
        assetManager.updatePrediction();
    } else {
        console.error('assetManagerが見つかりません');
    }
}

// アプリケーション初期化
let assetManager;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM読み込み完了、AssetManager初期化開始');
    assetManager = new AssetManager();
    window.assetManager = assetManager; // グローバルアクセス用
    console.log('AssetManager初期化完了');
    
    // 初期表示を確実にするため遅延実行
    setTimeout(() => {
        if (assetManager) {
            assetManager.updateDashboard();
            assetManager.updateAssetList();
            assetManager.updatePrediction();
            assetManager.updateExchangeRateDisplay();
            console.log('初期表示更新完了');
        }
    }, 500);
});

// 生存確認関数（グローバル）
function checkIn() {
    if (window.assetManager) {
        assetManager.checkIn();
    }
}

// 為替レート更新関数（グローバル）
function updateExchangeRates() {
    console.log('為替レート更新開始');
    if (window.assetManager) {
        console.log('assetManager見つかった、更新実行');
        window.assetManager.updateExchangeRates();
    } else {
        console.error('assetManagerが見つからない');
    }
}

// データエクスポート関数（グローバル）
function exportData() {
    if (window.assetManager) {
        assetManager.exportData();
    }
}

// データ削除関数（グローバル）
function clearAllData() {
    if (window.assetManager) {
        assetManager.clearAllData();
    }
}

// 資産名自動更新関数（グローバル）
function updateAssetName() {
    const assetType = document.getElementById('assetType').value;
    const assetNameInput = document.getElementById('assetName');
    
    if (assetType && !assetNameInput.value.trim()) {
        // 同じ種別の数をカウント
        const sameTypeCount = window.assetManager ? 
            window.assetManager.assets.filter(a => a.type === assetType).length : 0;
        assetNameInput.placeholder = `例: ${assetType}${sameTypeCount + 1}`;
    }
}

// 外国為替フィールド表示切り替え関数（グローバル）
function toggleForexFields() {
    const assetType = document.getElementById('assetType').value;
    const forexFields = document.getElementById('forexFields');
    const normalCurrencyGroup = document.getElementById('normalCurrencyGroup');
    const currencyField = document.getElementById('currency');
    const forexTargetCurrency = document.getElementById('forexTargetCurrency');
    const forexBaseCurrency = document.getElementById('forexBaseCurrency');
    
    if (assetType === '外国為替') {
        // 外国為替選択時：専用フィールド表示、通常の通貨選択を非表示
        forexFields.style.display = 'block';
        normalCurrencyGroup.style.display = 'none';
        currencyField.removeAttribute('required');
        forexTargetCurrency.setAttribute('required', 'required');
        forexBaseCurrency.setAttribute('required', 'required');
    } else {
        // その他選択時：通常の通貨選択表示、専用フィールドを非表示
        forexFields.style.display = 'none';
        normalCurrencyGroup.style.display = 'block';
        currencyField.setAttribute('required', 'required');
        forexTargetCurrency.removeAttribute('required');
        forexBaseCurrency.removeAttribute('required');
    }
}

// 月次更新関数（グローバル）
function performMonthlyUpdate() {
    if (window.assetManager) {
        assetManager.performMonthlyUpdate();
    }
}

// 月次更新取り消し関数（グローバル）
function undoMonthlyUpdate() {
    if (window.assetManager) {
        assetManager.undoMonthlyUpdate();
    }
}

// 資産金額調整関数（グローバル）
function adjustAssetAmount(assetId, type, adjustment) {
    if (window.assetManager) {
        assetManager.adjustAssetAmount(assetId, type, adjustment);
    }
}

// 資産金額更新関数（グローバル）
function updateAssetAmount(assetId, type, newValue) {
    if (window.assetManager) {
        assetManager.updateAssetAmount(assetId, type, newValue);
    }
}

// 積立額リセット関数（グローバル）
function resetMonthlyContribution(assetId) {
    if (window.assetManager) {
        assetManager.resetMonthlyContribution(assetId);
    }
}

// 全資産リセット関数（グローバル）
function resetAllAssets() {
    if (window.assetManager) {
        assetManager.resetAllAssets();
    }
}