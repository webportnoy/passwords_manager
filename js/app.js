function App(){

	// private vars
	var self = this,
		passwordsEncoded = null,
		passwords = [],
		masterMeta = null,
		title = Q(".logo .title"),
		defaultTilte = title.innerText,
		accountForm = Q(".accountForm"),
		loginActions = Q(".loginActions"),
		selectedCategory = null,
		selectedAccount = null,
		accountFormContains = null; // Тут будет либо new либо ключи категории и аккаунта

	// public
	this.backendUrl = "php/app.php";

	this.onLoad = function(){

		self.checkAuth();

		loginForm.on("submit", self.onMasterLoginSubmit );
		passForm.on("submit", self.onMasterPassSubmit );
		passChangeForm.on("submit", self.onPassChangeFormSubmit );
		btnSignOut.on("click", self.signOut );
		QQ(".backToMasterLogin").on("click", self.backToMasterLogin );
		QQ(".fileDownload").on("click", self.fileDownload );

		QQ(".addCateg").on("click", self.categoryAdd );
		Q(".categories").delegate(".categories .list-delete", "click", self.categoryDeleteClick );
		Q(".categories").delegate(".categories-item-text", "click", self.categorySelect );

		QQ(".addAccount").on("click", self.accountAdd );
		accountForm.on("submit", self.accountFormSubmit );
		Q(".accountsList").delegate(".accountsList-item-text", "click", self.accountSelect );
		Q(".accountsList").delegate(".accountsList .list-delete", "click", self.accountDeleteClick );

		document.body.on("passChanged", self.savePasswords );

		QQ(".btnGeneratePass").on("click", self.btnGenerateClick );
		QQ(".btnCopy").on("click", self.btnCopyClick );
		QQ(".btnViewPass").on("click", self.btnViewPassClick );

		btnSettings.on("click", self.toggleSettings );
	};

	this.savePasswords = function(){
		passwordsEncoded = self.encodePasswords();
		let data = {
			action: "save",
			login: masterMeta.login,
			token: masterMeta.token,
			passwords: passwordsEncoded
		};

		fetch( self.backendUrl, { method: "POST", credentials: "include", body: new URLSearchParams( data ) } )
		.then(r=>r.json())
		.then(r=>{
			if( r.response != "ok" ){
				alert("Can't save");
			}
			else{
				console.log("saved");
			}
		})
	};

	this.fileDownload = function( e ){
		let link = this,
			data = {
				action: "fileDownload",
				login: masterMeta.login,
				token: masterMeta.token
			};

		link.href = self.backendUrl + "?" + new URLSearchParams( data );
		setTimeout(()=>{link.href="javascript:;"}, 20);
	};

	this.accountDeleteClick = function( e ){
		let accountId = e.target.closest(".accountsList-item").dataset.id;
		if( confirm("Точно удалить?") ){
			self.accountDelete( selectedCategory, accountId );
		}
	};

	this.accountDelete = function( catId, accId ){
		passwords[catId].items.splice(accId, 1);
		self.categoryClickById( catId );
		document.body.trigger("passChanged");
	};

	this.accountParse = function( passObj, id ){
		let list = Q(".accountsList"),
			code = `<div class="accountsList-item list-item" data-id="${id}">
						<span class="accountsList-item-text list-item-text">${passObj.title}
							<div class="accountsList-item-login">${passObj.login}</div>
						</span>
						<i class="list-delete fa fa-trash"></i>
					</div>`;

		list.insertAdjacentHTML('beforeend', code );
	};

	this.accountAdd = function( e ){
		e && e.preventDefault();

		accountForm.reset();
		Q(".btnGeneratePass", accountForm).trigger("click");

		accountForm.classList.remove("hidden");
		accountForm.title.focus();

		QQ(".accountsList-item.active").removeClass("active");

		accountFormContains = "new";

	};

	this.accountFormSubmit = function( e ){
		e && e.preventDefault();

		let data = Object.fromEntries( new FormData( accountForm ) ),
			newAccountId;

		if( accountFormContains == "new" ){
			if( !data.title.length && data.login.length ){
				data.title = data.login;
			}
			newAccountId = passwords[selectedCategory].items.length;
			passwords[selectedCategory].items.push( data );
		}
		else if( accountFormContains ){
			passwords[selectedCategory].items[accountFormContains] = data;
			newAccountId = accountFormContains;
		}

		self.categoryClickById(selectedCategory);
		self.accountClickById(newAccountId);

		document.body.trigger("passChanged");
	};

	this.accountClickById = function(id){
		let accNode = Q(`.accountsList-item[data-id='${id}']`);

		selectedAccount = id;
		accountFormContains = id;

		accNode.siblings(".accountsList-item").forEach( e => { e.removeClass("active") });
		accNode.addClass("active");

		accountForm.classList.remove("hidden");

		let data = passwords[selectedCategory].items[selectedAccount];
		for( let key in data ){
			accountForm[key].value = data[key];
		}

	};

	this.accountSelect = function(e){
		let accNode = e.target.closest(".accountsList-item");
		self.accountClickById( accNode.dataset.id );
	};


	this.categoryClickById = function(id){
		let catNode = Q(`.categories-item[data-id='${id}']`);
		self.categorySelect( {target: catNode} );
	}

	this.categorySelect = function(e){
		let catNode = e.target.closest(".categories-item"),
			accountListNodes = QQ(".accountsList-item"),
			btnAddAccount = Q(".addAccount");

		selectedCategory = catNode.dataset.id;

		catNode.siblings(".categories-item").forEach( e => { e.removeClass("active") });
		catNode.addClass("active");

		btnAddAccount.removeAttribute("disabled");
		accountListNodes.forEach( el => el.remove() );

		accountForm.classList.add("hidden");

		if( passwords[selectedCategory].items.length ){
			passwords[selectedCategory].items.forEach( self.accountParse );
			self.accountClickById(0);
		}
	};

	this.categoryDeleteClick = function( e ){
		let catId = e.target.closest(".categories-item").dataset.id;
		if( confirm(`Точно удалить категорию ${passwords[catId].title} вместе с вложенными аккаунтами?`) ){
			self.categoryDelete( catId );
		}
	};

	this.categoryDelete = function( catId ){
		passwords.splice(catId, 1);
		self.categoryParseList();
		document.body.trigger("passChanged");
	};


	this.categoryAdd = function(){
		let itemName = prompt("Название новой категории", "Категория " + (passwords.length+1)),
			catId = passwords.length,
			catItem = {
				title: itemName,
				items: []
			};
		if( !itemName ) return;

		self.categoryParseItem( catItem, catId );
		passwords.push(catItem);

		self.categoryClickById( catId );
		document.body.trigger("passChanged");
	};

	this.categoryParseItem = function( catItem, id ){
		let categColumn = Q(".categories"),
			code = `<div data-id="${id}" class="categories-item list-item">
				<span class="categories-item-text list-item-text"><i class="far fa-folder mr"></i> ${catItem.title}</span>
				<i class="list-edit fa fa-pen"></i>
				<i class="list-delete fa fa-trash"></i>
			</div>`;

		categColumn.insertAdjacentHTML('beforeend', code );
	}

	this.categoryParseList = function(){

		// Очистка списков
		self.clearLists();

		// рисуем новые списки
		if( passwords.length ){
			passwords.forEach( self.categoryParseItem );
			self.categoryClickById( 0 );
		}
	};

	this.clearLists = function(){
		let listNodes = QQ(".categories-item,.accountsList-item"),
			btnAddAccount = Q(".addAccount");

		btnAddAccount.setAttribute("disabled", true);
		listNodes.forEach( el => el.remove() );
		accountForm.reset();
		accountForm.classList.add('hidden');
	};

	this.decodePasswords = function( str ){
		passwordsEncoded = str || passwordsEncoded;
		passwords = [];

		if( passwordsEncoded ){
			let dec = CryptoJS.AES.decrypt( passwordsEncoded, masterMeta.passwordsKey );
			passwords = JSON.parse( dec.toString(CryptoJS.enc.Utf8) );
		}
	};

	this.encodePasswords = function( obj, key ){
		obj = obj || passwords;
		key = key || masterMeta.passwordsKey;
		let encoded = "";

		if( obj ){
			let enc = CryptoJS.AES.encrypt(JSON.stringify(obj), key );
			encoded = enc.toString();
		}
		return encoded;
	};

	this.onMasterPassSubmit = function( e ){
		e.preventDefault();
		self.disableForm( passForm );
		masterMeta.pass = passForm.pass.value;
		passForm.reset();

		setTimeout(function(){
			self.rpHash( 
				masterMeta.pass,
				masterMeta.algos, 
				masterMeta.salt, 
				masterMeta.steps,
				self.sendMasterHash );
		},1);
	};

	this.sendMasterHash = function( dataToSend ){
		dataToSend.login = masterMeta.login;
		dataToSend.action = "getMasterPass";

		fetch( self.backendUrl, { method: "POST", credentials: "include", body: new URLSearchParams( dataToSend ) })
			.then(r=>r.json())
			.then(data=>{
				self.enableForm( passForm );
				if( data.response != "ok" ){
					alert( data.message );
					return;
				}
				passForm.classList.add("hidden");
				passwordsContainer.classList.remove("hidden");

				localStorage.passManagerLogin = masterMeta.login;
				masterMeta.token = data.token;
				masterMeta.key = dataToSend.key;
				masterMeta.passwordsKey = CryptoJS.MD5( masterMeta.pass ).toString()

				self.passwordsEncoded = data.passwords;
				self.decodePasswords( data.passwords );

				self.categoryParseList();
				loginActions.removeClass("hidden");
			});
	};

	this.onMasterLoginSubmit = function( e ){
		e && e.preventDefault();
		let frm = loginForm,
			formData = new FormData( frm );

		if( frm.classList.contains("loading") ) return;
		self.disableForm( frm );

		fetch(self.backendUrl, { method: "POST", credentials: "include", body: formData })
			.then(r=>r.json())
			.then(data=>{
				if( data.response != "ok" ){
					alert( data.message );
					return;
				}

				masterMeta = data.masterMeta;
				title.innerText = masterMeta.login;

				self.enableForm( frm );
				frm.classList.add("hidden");

				passForm.classList.remove("hidden");
				self.enableForm( passForm );
			});

	};

	this.checkAuth = function(){
		if( !('passManagerLogin' in localStorage) ){
			return;
		}

		loginForm.login.value = localStorage.passManagerLogin;
		self.onMasterLoginSubmit();
	};

	this.backToMasterLogin = function(){
		loginForm.classList.remove("hidden");
		self.enableForm( loginForm );

		passForm.reset();
		passForm.classList.add("hidden");
		self.disableForm( passForm );
	};

	this.signOut = function(){
		masterMeta = null;
		passwords = [];
		passwordsEncoded = null;
		title.innerText = defaultTilte;

		self.clearLists();

		passwordsContainer.addClass("hidden");
		Q(".settings").addClass("hidden");
		self.checkAuth();
	};

	this.toggleSettings = function(){
		let settingsBlock = Q(".settings"),
			isActive = !settingsBlock.classList.contains("hidden");

		if( isActive ){
			passwordsContainer.removeClass("hidden");
			settingsBlock.addClass("hidden");
		}
		else{
			passwordsContainer.addClass("hidden");
			settingsBlock.removeClass("hidden");
		}
	};

	this.onPassChangeFormSubmit = function( e ){
		e.preventDefault();

		self.disableForm( passChangeForm );
		masterMeta.pass = passChangeForm.pass.value;
		passChangeForm.reset();

		setTimeout(function(){
			self.rpHash( 
				masterMeta.pass,
				masterMeta.algos, 
				masterMeta.salt, 
				masterMeta.steps,
				self.sendNewMasterHash );
		},1);

	};

	this.sendNewMasterHash = function( data ){

		let passwordsKey = CryptoJS.MD5( masterMeta.pass ).toString();
		data.passwords = self.encodePasswords( passwords, passwordsKey );
		data.new_key = data.key;

		data.key = masterMeta.key;
		data.login = masterMeta.login;
		data.token = masterMeta.token;
		data.action = "setNewMasterPass";

		fetch( self.backendUrl, { method: "POST", credentials: "include", body: new URLSearchParams( data ) })
		.then(r=>r.json())
		.then(r=>{
			self.enableForm( passChangeForm );
			if( r.response != "ok" ){
				alert( r.message );
				return;
			}
			passwordsEncoded = data.passwords;
			masterMeta.pass = data.key;
			masterMeta.passwordsKey = passwordsKey;
			alert("ok");
		});
	};

	this.disableForm = function( frm ){
		frm.classList.add("loading");
		let btns = QQ("button,input[type='submit']", frm);
		btns.forEach(btn=>{
			btn.classList.add("disabled");
			btn.disabled = true;
		});
	};

	this.enableForm = function( frm ){
		frm.classList.remove("loading");
		let btns = QQ("button,input[type='submit']", frm),
			inps = QQ("input", frm).visible();
		btns.forEach(btn=>{
			btn.classList.remove("disabled");
			btn.removeAttribute("disabled");
		});
		if( inps && inps.length ){
			inps[0].focus();
		}
	};

	this.getCharsString = function(){
		const chars = {
			ch_az: "qwertyuiopasdfghjklzxcvbnm",
			ch_AZ: "QWERTYUIOPASDFGHJKLZXCVBNM",
			ch_09: "1234567890",
			ch_az_rus: "йцукенгшщзфывапролджэячсмитьбюё",
			ch_AZ_rus: "ЙЦУКЕНГШЩЗФЫВАПРОЛДЖЭЯЧСМИТЬБЮЁ",
			ch_simp: "-*_-*_-*_",
			ch_spec: "!@#$%^&()+{}[]?.,:;"
		};
		let str = "";
		QQ(".settings input:checked").forEach(function( el ){
			str += chars[el.name];
		});
		str += iDop.value;
		return str;
	};

	this.btnGenerateClick = function(){
		let newPass = self.RandomChars( iLen.value, self.getCharsString() );
		this.siblings(".password")[0].value = newPass;
		navigator.clipboard.writeText( newPass );
	};

	this.btnCopyClick = function(event){
		navigator.clipboard.writeText( this.siblings(".form-input")[0].value );
	};

	this.btnViewPassClick = function( event ){
		let slashClass = "fa-eye-slash",
			icon = Q("i", this),
			isActive = 1*icon.classList.contains(slashClass),
			inp = this.siblings(".password")[0],
			preset = [
				{type: "password", slashAcion: "add"},
				{type: "text", slashAcion: "remove"}
			];
		inp.type = preset[isActive].type;
		icon.classList[preset[isActive].slashAcion](slashClass);
	};

	this.RandomChars = function( n, chars ){
		n = n || 8;
		chars = chars || "qwertyuiopasdfghjklzxcvbnm1234567890";
		var str = "";
		for( i = 0; i < n; i++ ){
			str += chars.charAt( Math.round( Math.random()*(chars.length-1) ) );
		}
		return str;
	};

	this.rpHash = function( pass, algos="", salt='', steps=65536, callback ){
		if( algos ){
			algos = algos.toUpperCase().split(",");
		}
		else{
			algos = self.shuffle("MD5,SHA1,SHA224,SHA256,SHA512,RIPEMD160".split(","));
		}

		if( !salt ){
			salt = app.RandomChars(32);
		}

		let step_iterator = 0,
			algo_iterator = 0,
			algos_count = algos.length,
			key = "",
			ret;

		do{
			key = CryptoJS[algos[algo_iterator]]( key + pass + salt ).toString();
			algo_iterator++;
			if( algo_iterator >= algos_count ){
				algo_iterator = 0;
			}
			step_iterator++;
		}while( step_iterator < steps);

		ret = {
			key: CryptoJS.MD5( key ).toString(),
			algos: algos.join(",").toLowerCase(),
			salt,
			steps
		};

		if( typeof(callback) == "function"){
			callback(ret);
		}

		return ret;

	};

	/**
	 * Shuffles array in place. ES6 version
	 * @param {Array} a items An array containing the items.
	 */
	this.shuffle = function(a) {
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	};

	return this;
}

const app = new App();
window.on("load", app.onLoad );


