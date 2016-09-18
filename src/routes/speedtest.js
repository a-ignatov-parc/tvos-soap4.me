/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
import assign from 'object-assign';

import {request} from '../request';
import {noop, getStartParams} from '../utils';
import {
	getSpeedTestServers,
	saveSpeedTestResults,
} from '../request/soap';

import Loader from '../components/loader';

const {Promise} = TVDML;

const countriesMapping = {
	fr: 'France',
	de: 'Germany',
	nl: 'Netherlands',
	ru: 'Russian Federation',
};

const fileSize = 10567604;

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				return {
					results: {},
					skipped: {},
					progress: 0,
					servers: null,
					loading: true,
					running: false,
				};
			},

			componentDidMount() {
				// To improuve UX on fast request we are adding rendering timeout.
				let waitForAnimations = new Promise((resolve) => setTimeout(resolve, 500));

				Promise
					.all([getSpeedTestServers(), waitForAnimations])
					.then(([servers]) => this.setState(assign({loading: false}, {servers})));
			},

			render() {
				const {BASEURL} = getStartParams();

				let {
					running,
					results,
					skipped,
					loading,
					servers,
					progress,
				} = this.state;

				if (loading) {
					return <Loader title="Loading servers info..." />
				}

				let serversList = Object
					.keys(servers)
					.map(id => ({id, file: servers[id]}));

				return (
					<document>
						<stackTemplate>
							<banner>
								<title>Speed test</title>
							</banner>
							<collectionList>
								<shelf centered="true" style="tv-interitem-spacing: 150; margin: 228 0 0">
									<section>
										{serversList.map(({id, file}) => {
											let result = '...';

											if (skipped[id]) {
												result = 'Too slow. Skipped...';
											} else if (results[id]) {
												result = `${results[id]} Mb/s`;
											}

											return (
												<lockup key={id} disabled="true">
													<title style="margin: 0 0 10">{countriesMapping[id]}</title>
													<img
														width="298"
														height="200"
														src={`${BASEURL}/assets/countries/${id}.png`}
													/>
													<subtitle style="margin: 10 0 0">{result}</subtitle>
													<overlay style="margin: 0; padding: 0;">
														{(results[id] || skipped[id]) && (
															<badge
																src="resource://button-checkmark"
																style="tv-position: center; tv-align: center"
															/>
														)}
														{running === id && (
															<progressBar value={progress / 100} />
														)}
													</overlay>
												</lockup>
											);
										})}
									</section>
								</shelf>
								<row style="tv-align: center">
									{running ? (
										<text style="tv-text-style: headline; color: rgb(84, 82, 80)">
											Testing download speed...
										</text>
									) : (
										<button onSelect={this.onStart}>
											<text>Begin test</text>
										</button>
									)}
								</row>
							</collectionList>
						</stackTemplate>
					</document>
				);
			},

			onStart() {
				if (this.state.running) return;

				let chain = Promise.resolve({});

				Object
					.keys(this.state.servers)
					.forEach(id => {
						chain = chain.then(results => {
							let request;

							this.setState({
								results,
								running: id,
								progress: 0,
							});

							let timer = setInterval(() => {
								if (this.state.progress >= 100) {
									return request.abort();
								}
								this.setState({progress: this.state.progress + 1});
							}, 300);

							return createLoader(id, this.state.servers[id], (xhr) => request = xhr)
								.then(result => {
									clearInterval(timer);
									return assign({}, results, result);
								})
								.catch(() => {
									clearInterval(timer);
									this.setState({skipped: assign({[id]: true}, this.state.skipped)});
									return assign({[id]: (1).toFixed(2)}, results);
								});
						});
					});

				chain
					.then(results => {
						this.setState({
							results,
							progress: 0,
							running: false,
						});
						return results;
					})
					.then(saveSpeedTestResults);
			},
		})));
}

function createLoader(id, file, resolver = noop()) {
	let start = Date.now();

	return request(file, {
		prepare(xhr) {
			resolver(xhr);
			return xhr;
		},
	}).then(() => {
		let end = Date.now();
		let diff = end - start;
		let seconds = diff / 1000;
		let speed = (fileSize / seconds) / 102400;
		let prettifiedSpeed = speed.toFixed(2);

		return {[id]: prettifiedSpeed};
	});
}
