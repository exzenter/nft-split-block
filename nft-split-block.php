<?php
/**
 * Plugin Name:       NFT Split Block
 * Description:       Interactive recursive split pattern canvas block with full customization.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            NFT Split
 * License:           GPL-2.0-or-later
 * Text Domain:       nft-split-block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function nft_split_block_init() {
	register_block_type( __DIR__ . '/build' );
}
add_action( 'init', 'nft_split_block_init' );

function nft_split_block_frontend_script() {
	if ( has_block( 'nft-split/canvas' ) ) {
		wp_enqueue_script(
			'nft-split-frontend',
			plugins_url( 'build/frontend.js', __FILE__ ),
			array(),
			filemtime( plugin_dir_path( __FILE__ ) . 'build/frontend.js' ),
			true
		);
	}
}
add_action( 'wp_enqueue_scripts', 'nft_split_block_frontend_script' );
