
const API_URI = 'http://localhost:4000' || "https://spark-mea.com";
const currentURI = API_URI;
const FRONTEND_URI = 'http://localhost:3000'
const instance = axios.create({
    baseURL: API_URI,

})
const slidesParent = document.querySelector('.slides');
const title = document.querySelector('title');
const query = new URLSearchParams(window.location.search);
const presentationId = query.get('pres');
const token = query.get('token');
const sessionName = query.get('name');
const feature = query.get('feature');
const user = query.get('user');
const views = query.get('views');

const live = feature === "live-share";
const off = feature === "offline"
const presentationPath = '/api/presentation'
const questionPath = '/api/question'
const sessionPath = '/api/session'
async function getPresentation(ID) {
    const response = await instance.get(presentationPath + `/${ID}?token=${token}&name=${sessionName}&user=${user}&feature=${feature}&views=${views}`);
    const { data } = response;

    return data;
}
async function main(ID) {
    try {

        const { presention, verify, sessionId } = await getPresentation(ID)
        console.log(`Presentation response`, sessionId)
        if (!verify) {
            const h3 = document.createElement('h3');
            const NameSection = document.createElement('section');
            h3.innerText = "unverfied token";
            NameSection.appendChild(h3);
            slidesParent.append(NameSection)
        }
        else {
            if (presention.slides.length) {
                const { slides, name } = presention;
                const NameSection = document.createElement('section');
                const h1 = document.createElement('h1');
                h1.innerText = name;
                NameSection.append(h1);
                title.innerHTML = name
                slidesParent.append(NameSection)
                await visualizeSlides(slides, presention.name, sessionName, sessionId)

            }

        }
        await Reveal.initialize({
            hash: false,
            autoPlayMedia: false,
            slideNumber: true,
            help: true,
            preloadIframes: true,
            plugins: [RevealMarkdown, RevealHighlight, RevealMenu,],

        });
        if (live) {
            unregister()
        } else
            register();
        return presention;
    }
    catch (err) {
        const NameSection = document.createElement('section');
        NameSection.innerText = err.message;
        if (err.message === "Network Error") return location.reload()
        slidesParent.append(NameSection)
        if (err.response) {
            console.error(err.response);

        }
        console.error(err)
    }
    await Reveal.initialize({
        hash: false,
        autoPlayMedia: false,
        slideNumber: true,
        help: true,


        plugins: [RevealMarkdown, RevealHighlight,],

    });


}
async function visualizeSlides(slides, presname, sessionname, sessionId) {
    try {
        if (!slides.length) return;

        for (let slide of slides) {
            const slidePath = API_URI + "/" + slide.path;
            const slideSection = document.createElement('section');
            const h4 = document.createElement('h4');
            if (slide.name && slide.type !== 'question') {

                h4.innerText = slide.name;
                slideSection.appendChild(h4);
            }
            if (slide.type === 'image') {
                try {
                    const cachedPath = await saveMedia(slidePath);
                    if (slidePath.endsWith('.pdf')) {
                        slideSection.setAttribute('data-background-iframe', cachedPath);
                        h4.style = "display:none;"
                    } else {
                        slideSection.setAttribute('data-background-image', cachedPath);

                    }

                }
                catch (e) {
                    console.error(e)
                }


            }
            else if (slide.type === 'video') {
                try {
                    const video = document.createElement('video');
                    const cachedPath = await saveMedia(slidePath);
                    console.log(cachedPath);
                    video.src = cachedPath;
                    video.controls = true

                    slideSection.appendChild(video);
                    slideSection.id = 'video-section';

                }

                catch (e) {
                    console.error(e)
                }



            }
            else if (slide.type === 'audio') {
                try {
                    const audio = document.createElement('audio');
                    audio.controls = true;
                    const cachedPath = await saveMedia(slidePath);
                    audio.src = cachedPath;
                    slideSection.appendChild(audio);
                }
                catch (e) {
                    console.error(e)
                }

            }
            else if (slide.type === 'html') {
                // const { data } = await axios.get(slidePath);
                // if (data) {
                //     const folder = slidePath.split('/index.html')[0];
                //     const parser = new DOMParser();
                //     dom = parser.parseFromString(data, "text/html");
                //     console.log(dom)
                //     const scrips = dom.querySelectorAll('script');
                //     const links = dom.querySelectorAll('link');
                //     for (let link of links) {
                //         const relativePath = link.href.split(currentURI)[1]
                //         link.href = folder + relativePath;
                //     }
                //     for (let script of scrips) {
                //         const relativePath = script.src.split(currentURI)[1]
                //         script.src = folder + relativePath;
                //         script.defer;
                //     }
                // }
                // const newUrl = htmlToBlob(dom)
                try {
                    slideSection.setAttribute('data-background-iframe', slidePath);


                    h4.style = "display:none"
                }
                catch (e) {
                    console.error(e)
                }

            }
            else if (slide.type === 'question') {
                const VotingSection = document.createElement('section');
                VotingSection.setAttribute('id', "votingSection")
                const template = document.querySelector('template');
                const answersTemplate = document.querySelector('#answer-template')
                const content = template.content.cloneNode(true);
                const answersContent = answersTemplate.content.cloneNode(true);
                const title = content.querySelector('.question-title');
                const VotingTitle = answersContent.querySelector('.question-title')
                const presName = content.querySelector('.pres-name');
                const votingPresName = answersContent.querySelector('.pres-name');
                const votingChart = answersContent.querySelector('.chart');
                const votingSessionName = answersContent.querySelector('.session-name');
                const sessionName = content.querySelector('.session-name');
                const questionOptions = content.querySelector('.question-options')
                const form = content.querySelector('form')
                const qr = content.querySelector('.question-qr')
                const chartParent = answersContent.querySelector('.chart-parent')
                chartParent.setAttribute('id', `c-${slide._id}`)
                presName.innerHTML = `presenation name: ${presname}`;
                votingPresName.innerHTML = `presenation name: ${presname}`;
                presName.style.fontSize = "1rem"
                votingPresName.style.fontSize = "1rem"
                sessionName.innerHTML = `session name: ${sessionname}`;
                votingSessionName.innerHTML = `session name: ${sessionname}`;
                votingSessionName.style.fontSize = "1rem"
                sessionName.style.fontSize = "1rem"
                title.innerHTML = slide.name;
                VotingTitle.innerHTML = slide.name + " answers"
                votingChart.setAttribute('id', slide._id)

                const labels = [];
                const answers = [];
                const res = await axios.get(API_URI + questionPath + `/${slide._id}`);
                const { data } = res;
                const { question } = data;
                questionAnswers = question.answers;
                if (questionAnswers.length) {
                    for (let answer of questionAnswers) {
                        const { option, votes } = answer;
                        labels.push(option);
                        answers.push(votes)
                    }
                }
                const datasets = [
                    {
                        label: 'answers',
                        data: answers,
                        backgroundColor: '#FFFFFF',

                    }];

                let stats = { labels, datasets };
                const myChart = new Chart(votingChart, {
                    type: 'bar',
                    data: stats,
                    options: {
                        plugins: {
                            legend: {
                                labels: {
                                    // This more specific font property overrides the global property
                                    font: {
                                        size: 22
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });

                const fullUrl = `${API_URI}/question?ID=${slide._id}&id=${sessionId}`;

                new QRCode(qr, `${fullUrl}`)
                let order = 0;
                let isVoted = false;

                for (let opt of slide.options) {
                    order++;

                    const label = document.createElement('li');
                    const radio = document.createElement('input');
                    const counterCircle = document.createElement('div')
                    counterCircle.style.cssText = "background: #CE3A30; border-radius:50%; width:50px;height:50px;display:flex;align-items:center;justify-content:center; margin;";
                    counterCircle.innerHTML = order;
                    const h6 = document.createElement('h6');
                    h6.innerText = opt;
                    h6.style.cssText = "margin-right:auto;"
                    radio.type = "radio"
                    radio.name = slide.name;
                    radio.value = opt;
                    radio.setAttribute("class", 'h-10 w-10 ml-2 ');
                    label.append(counterCircle)
                    label.append(h6)
                    label.appendChild(radio)
                    label.setAttribute("class", "flex align-center justify-center ")
                    questionOptions.append(label)
                }
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    if (isVoted) return alert("already voted !");
                    const value = document.querySelector(`input[name="${slide.name}"]:checked`).value;
                    const res = await axios.get(API_URI + questionPath + `-answer/${slide._id}?answer=${value}&token=${token}&id=${sessionId}`);
                    const { data } = res;
                    console.log(data);
                    if (data.success) isVoted = true;
                    alert(data.message);

                })
                VotingSection.setAttribute('question-id', slide._id)
                VotingSection.setAttribute('session-id', sessionId)
                //////////////////////
                slideSection.appendChild(content);
                VotingSection.append(answersContent)
                slidesParent.appendChild(slideSection)
                slidesParent.appendChild(VotingSection)

            }
            if (slide.type !== "question")
                slidesParent.append(slideSection)


        }
    }
    catch (err) {
        console.error(err)
        console.log(err.message)
    }
}


main(presentationId)
Chart.defaults.font.size = 24;
Reveal.on('slidechanged', (event) => {
    const { indexh, indexv, currentSlide } = event;
    const questionId = currentSlide.getAttribute('question-id');
    const sessionId = currentSlide.getAttribute('session-id');

    if (questionId) {
        axios.get(API_URI + sessionPath + `/${sessionId}`).then((res) => {

            const chartParent = document.getElementById(`c-${questionId}`);
            const votingChart = document.createElement('canvas');
            votingChart.setAttribute('class', "chart")
            chartParent.innerHTML = "";
            chartParent.append(votingChart);
            const { data } = res;
            console.log(data)
            const { session } = data;
            const { questions } = session;
            console.log(questions)
            if (questions.length)
                question = questions.find(q => q.question._id === questionId)
            questionAnswers = question.answers;
            labels = []
            answers = []
            const datasets = [
                {
                    label: 'answers',
                    data: answers,
                    barThikness: 18,
                    maxBarThickness: 45,
                    backgroundColor: [],

                }];
            if (questionAnswers.length) {
                for (let answer of questionAnswers) {
                    const { option, votes } = answer;
                    labels.push(option);
                    answers.push(votes)
                    datasets[0].backgroundColor.push(getRandomColor())
                }
            }



            let stats = { labels, datasets };
            const myChart = new Chart(votingChart, {
                type: 'bar',

                data: stats,
                options: {
                    indexAxis: 'y',
                    responsive: false,
                    plugins: {
                        datalabels: {
                            font: {
                                weight: 'bold',
                                size: 24,
                            }
                        },
                        legend: {
                            display: false
                        },
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) { if (value % 1 === 0) { return value; } },
                                beginAtZero: true,

                                stepSize: 1
                            },
                        },
                        // y: {
                        //     beginAtZero: true,
                        //     ticks: {
                        //         stepSize: 1
                        //     }
                        // }
                    }
                }
            });
        });


    }
}
)



if (live) {
    var socket = io(API_URI);
    socket.emit('join', token)
    Reveal.on('slidechanged', event => {
        // event.previousSlide, event.currentSlide, event.indexh, event.indexv
        const { indexh, indexv, currentSlide } = event;
        socket.emit('page-change', token, indexh, indexv, currentSlide);
    });

    socket.on('server-page-change', (indexh, indexv, currentSlide) => {
        Reveal.slide(indexh, indexv, currentSlide);
    })
}

async function saveMedia(url, type = "blob") {
    const media = await axios.get(url, { responseType: type })
    const loadedURL = URL.createObjectURL(media.data)
    return loadedURL;
}



async function saveHtml(url) {
    var htmlContent = await axios.get(url, { responseType: "html" });
    var html = htmlContent.data;

    const saved = htmlToBlob(html);

    return saved;
}
function htmlToBlob(document) {
    const html = document.documentElement.outerHTML;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    console.log(blobUrl);
    return blobUrl;
};



function makeChart(element) {
    const ctx = element.getElementById('chart').getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
            datasets: [{
                label: '# of Votes',
                data: [12, 19, 3, 5, 2, 3],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function register() {
    try {

        navigator.serviceWorker.register('../sw.js')

    }
    catch (e) {
        console.error("Error", e)
    }
}
function unregister() {
    try {

        navigator.serviceWorker.getRegistrations().then(function (registrations) {
            for (let registration of registrations) {
                registration.unregister()
            }
            for (let registration of registrations) {
                if (registration.live) window.location.reload()
            }
        })

    }
    catch (e) {
        console.error("Error", e)
    }
}
window.addEventListener('DOMContentLoaded', (event) => {

    register();

});
function getRandomColor() {
    const colorArray = ["#b09e70", "#c0270c", "##2aa2e6", "#f2ba03"];
    const color = colorArray[Math.floor(Math.random() * colorArray.length - 1)];
    return color;
}
