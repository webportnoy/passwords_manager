<?php

function tokenGenerate( $login ){
	$ip = get_ip();
	return md5( md5( "{$login}-{$ip}" ));
}

function tokenCheck( $login, $token ){
	return $token == tokenGenerate( $login );
}

function checkData( $data, $tests, $defaults=[] ){
	if( count( $data ) != count( $tests ) ){
		exitError("Wrong data");
	}
	foreach( $tests as $key => $reg_ex ){
		if( !isset( $data[$key] ) || !preg_match($reg_ex, $data[$key] ) ){
			exitError("1. Wrong {$key}");
		}
		elseif( isset($defaults[$key]) && $defaults[$key] != $data[$key] ){
			exitError("2. Wrong {$key}");
		}
	}
}

function exitError( $msg ){
	json_out( [
		'response' => "error",
		'message' => $msg
	] );
}

/**
 * Вывод данных в формате json
 */
function json_out( $data ){
	header("Content-type: application/json");
	echo json_encode( $data );
	exit;
}

/*
*  Генератор абракадабры
*/
function RandomChars( $c=8, $chars = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890"){
	$str = "";
	for($i=0; $i<$c; $i++){
		srand((double) microtime()*1000000);
		$n = rand(strlen($chars), 1)-1;
		$str .= $chars[$n];
	}
	return $str;
}

function randomAlogs($algos="MD5,SHA1,SHA224,SHA256,SHA512,RIPEMD160"){
	$algos = explode(",", strtolower($algos) );
	shuffle($algos);
	return $algos;
}

function arr_get( $arr, $key ){
	return isset( $arr[$key] ) ? $arr[$key] : false;
}

// Получение реального ip через прозрачные прокси
function get_ip(){
	$ip = false;
	$ipa = array();

	if( isset($_SERVER['HTTP_X_FORWARDED_FOR']) ){
		$ipa[] = trim(strtok($_SERVER['HTTP_X_FORWARDED_FOR'], ','));
	}

	if( isset($_SERVER['HTTP_CLIENT_IP']) ){
		$ipa[] = $_SERVER['HTTP_CLIENT_IP'];
	}

	if( isset($_SERVER['HTTP_X_REAL_IP']) ){
		$ipa[] = $_SERVER['HTTP_X_REAL_IP'];
	}

	if( isset($_SERVER['REMOTE_ADDR']) ){
		$ipa[] = $_SERVER['REMOTE_ADDR'];
	}

	foreach($ipa as $ips){
		if( is_valid_ip( $ips ) ){
			$ip = $ips;
			break;
		}
	}
	return $ip;
}


// Проверяет валидность ip
function is_valid_ip( $ip ){
	// IPv4
	if( preg_match("#^([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$#", $ip)){
		return true;
	}
	// IPv6
	if( preg_match("#((^|:)([0-9a-fA-F]{0,4})){1,8}$#", $ip)){
		return true;
	}
	return false;
}

