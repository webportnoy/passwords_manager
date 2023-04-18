<?php

function do_fileDownload( $input ){

	checkData( $input, [
		'login' => "/^[a-zA-Z0-9_]{4,}$/",
		'token' => "/^[a-z0-9]{32}$/"
	]);

	$fileName = "../storage/{$input['login']}.json";
	if( !file_exists( $fileName ) || $_SESSION['masterMeta']['login'] != $input['login'] ){
		exitError("Wrong login");
	}

	$fileData = json_decode( file_get_contents( $fileName ), 1 );
	if( !tokenCheck( $input['login'], $input['token'] ) || $fileData['token'] != $input['token'] ){
		exitError( "token not correct" );
	}

	header("Content-Type: application/octet-stream");
	header("Content-Disposition: attachment; filename=\"" . basename($fileName) . "\"" );
	header("Content-Length: ".(string)(filesize( $fileName ) ) );
	header("Content-Transfer-Encoding: binary\n");
	$fh = fopen( $fileName, 'rb' );
	fpassthru( $fh );
	@fclose( $fh );
	exit;
}

function do_save( $input ){
	$resp = [
		"response" => "ok"
	];

	checkData( $input, [
		'login' => "/^[a-zA-Z0-9_]{4,}$/",
		'token' => "/^[a-z0-9]{32}$/",
		'passwords' => "/./"
	]);

	$fileName = "../storage/{$input['login']}.json";
	if( !file_exists( $fileName ) ){
		exitError("lost data");
	}

	$fileData = json_decode( file_get_contents( $fileName ), 1 );

	if( !tokenCheck( $input['login'], $input['token'] ) || $fileData['token'] != $input['token'] ){
		exitError( "token not correct" );
	}

	$fileData['passwords'] = $input['passwords'];
	file_put_contents( $fileName, json_encode( $fileData ) );

	json_out($resp);
}

// Получаю мастер логин и возвращаю алгоритмы с солью
function do_getMasterLogin( $input ){
	$resp = [
		"response" => "ok"
	];

	checkData( $input, ['login' => "/^[a-zA-Z0-9_]{4,}$/"] );

	$_SESSION['masterMeta'] = ['login' => $input['login']];

	$fileName = "../storage/{$input['login']}.json";
	if( file_exists( $fileName ) ){
		$fileData = json_decode( file_get_contents( $fileName ), 1 );
		$_SESSION['masterMeta']['salt'] = $fileData['salt'];
		$_SESSION['masterMeta']['algos'] = $fileData['algos'];
		$_SESSION['masterMeta']['steps'] = $fileData['steps'];
	}
	else{
		$_SESSION['masterMeta']['salt'] = RandomChars(32);
		$_SESSION['masterMeta']['algos'] = implode(",", randomAlogs() );
		$_SESSION['masterMeta']['steps'] = rand(60000,65536);
	}
	$resp['masterMeta'] = $_SESSION['masterMeta'];

	json_out($resp);
}

function do_getMasterPass( $input ){
	$resp = [
		"response" => "ok",
		'token' => tokenGenerate( $input['login'] )
	];

	if( !$_SESSION['masterMeta'] ) exitError("Cant find masterMeta");

	checkData( $input, [
		'login' => "/^[a-zA-Z0-9_]{4,}$/",
		'key' => "/^[a-z0-9]{32}$/",
		'salt' => "/^[a-z0-9]{32}$/i",
		'algos' => "/^[a-z0-9\,]+$/",
		'steps' => "/^[0-9]+$/"
	], $_SESSION['masterMeta'] );
	$_SESSION['masterMeta']['key'] = $input['key'];

	$fileName = "../storage/{$input['login']}.json";
	if( file_exists( $fileName ) ){
		$fileData = json_decode( file_get_contents( $fileName ), 1 );
		checkData( $input, [
			'login' => "/./",
			'key' => "/./",
			'salt' => "/./",
			'algos' => "/./",
			'steps' => "/./"
		], $fileData );

		$resp['passwords'] = $fileData['passwords'];

		$fileData['token'] = $resp['token'];
		file_put_contents( $fileName, json_encode( $fileData ) );
	}
	else{
		$data = $_SESSION['masterMeta'];
		$data['token'] = $resp['token'];
		$data['passwords'] = "";
		file_put_contents( $fileName, json_encode( $data ) );

		$resp['passwords'] = $data['passwords'];
	}

	$_SESSION['masterMeta']['token'] = $resp['token'];

	json_out($resp);
}

function do_setNewMasterPass( $input ){
	$resp = [
		"response" => "ok"
	];

	checkData( $input, [
		'login' => "/^[a-zA-Z0-9_]{4,}$/",
		'key' => "/^[a-z0-9]{32}$/",
		'salt' => "/^[a-z0-9]{32}$/i",
		'algos' => "/^[a-z0-9\,]+$/",
		'steps' => "/^[0-9]+$/",
		'token' => "/^[a-z0-9]{32}$/",
		'passwords' => "/./"
	] );

	$_SESSION['masterMeta']['key'] = $input['key'];

	$fileName = "../storage/{$input['login']}.json";
	if( !file_exists( $fileName ) ){
		exitError("lost data");
	}

	$fileData = json_decode( file_get_contents( $fileName ), 1 );

	if( !tokenCheck( $input['login'], $input['token'] ) || $fileData['token'] != $input['token'] || $_SESSION['masterMeta']['token'] != $input['token'] ){
		exitError( "token not correct" );
	}

	$fileData['key'] = $input['key'];
	$fileData['passwords'] = $input['passwords'];
	file_put_contents( $fileName, json_encode( $fileData ) );

	json_out($resp);
}
