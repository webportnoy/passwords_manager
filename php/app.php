<?php

require_once("funcs.php");
require_once("actions.php");

if( !ini_get('session.auto_start') ){
	session_start();
}

$action = "do_" . arr_get($_REQUEST, 'action');

if( function_exists( $action ) ){
	unset( $_REQUEST['action'] );
	$action( $_REQUEST );
}
else{
	exitError("no action");
}