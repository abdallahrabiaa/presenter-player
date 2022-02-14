const API_URI = `http://${window.location.hostname}:4000`;
const FRONTEND_URI = 'http://localhost:3000'
const instance = axios.create({
    baseURL: API_URI,

})
var socket = io(API_URI);
const slidesParent = document.querySelector('.slides');
const title = document.querySelector('title');
const query = new URLSearchParams(window.location.search);
const presentationId = query.get('pres');
const token = query.get('token');
const live = query.get('feature') === "live-share";

const presentationPath = '/api/presentation'
const questionPath = '/api/question'
async function getPresentation(ID) {
    try {
        const response = await instance.get(presentationPath + `/${ID}?token=${token}`);
        const { data } = response;
        const { presention, verify } = data;
        console.log(`Presentation response`, response)
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
                await visualizeSlides(slides)

            }

        }
        await Reveal.initialize({
            hash: false,
            autoPlayMedia: true,
            slideNumber: true,
            help: true,

            plugins: [RevealMarkdown, RevealHighlight, RevealMenu],

        });
        return presention;
    }
    catch (err) {
        const NameSection = document.createElement('section');
        NameSection.innerText = err.message;
        slidesParent.append(NameSection)
        if (err.response) {
            console.error(err.response);
        }
        console.error(err)
    }
    await Reveal.initialize({
        hash: false,
        autoPlayMedia: true,
        slideNumber: true,
        help: true,


        plugins: [RevealMarkdown, RevealHighlight],

    });

}
async function visualizeSlides(slides) {
    if (!slides.length) return;

    for (let slide of slides) {
        const slideSection = document.createElement('section');
        const h4 = document.createElement('h4');
        if (slide.name) {
            h4.innerText = slide.name;
            slideSection.appendChild(h4);
        }
        if (slide.type === 'image') {
            slideSection.setAttribute('data-background-image', API_URI + "/" + slide.path);
        }
        else if (slide.type === 'video') {
            const video = document.createElement('video');
            video.src = API_URI + "/" + slide.path;
            video.controls = true

            slideSection.appendChild(video);


        }
        else if (slide.type === 'audio') {
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.src = API_URI + "/" + slide.path;
            slideSection.appendChild(audio);


        }
        else if (slide.type === 'html') {
            slideSection.setAttribute('data-background-iframe', API_URI + "/" + slide.path);

        }
        else if (slide.type === 'question') {
            let isVoted = false;
            const VotingSection = document.createElement('section');
            VotingSection.setAttribute('id', "votingSection")
            const qr = document.createElement('div');
            const ul = document.createElement('ul');
            const select = document.createElement('select');
            const form = document.createElement('form');
            const submitButton = document.createElement('input');
            submitButton.type = 'submit';
            submitButton.
                setAttribute('class', "py-2 px-4  bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 focus:ring-offset-indigo-200 text-white ml-2 transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2  rounded-lg")
            form.append(select);
            select.setAttribute('class', " w-52 text-gray-700  border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500")
            for (let opt of slide.options) {
                const option = document.createElement('option');
                option.setAttribute('value', opt);
                option.innerHTML = opt;
                select.append(option);
            }
            form.append(submitButton)
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (isVoted) return alert("already voted !");
                const value = select.value;
                const res = await axios.get(API_URI + questionPath + `-answer/${slide._id}?answer=${value}&token=${token}`);
                const { data } = res;
                console.log(data);
                if (data.success) isVoted = true;
                alert(data.message);

            })
            slideSection.appendChild(form)
            qr.style.display = "inline-block"
            new QRCode(qr, `${FRONTEND_URI}/question?ID=${slide._id}&token=${token}`)
            slideSection.appendChild(qr);

            if (slide.answers.length) {
                const h3 = document.createElement('h3');
                h3.innerText = `${slide.name}-answers`
                VotingSection.append(h3)
                for (let answer of slide.answers) {
                    const { option, votes } = answer;
                    const li = document.createElement('li');
                    li.innerText = `${option}: ${votes}`;
                    ul.append(li)
                }
                VotingSection.append(ul)
                slidesParent.append(slideSection)
                slidesParent.append(VotingSection)
            } else {
                slidesParent.append(slideSection)

            }


        }
        if (slide.type !== "question")
            slidesParent.append(slideSection)


    }

}

getPresentation(presentationId)
if (live) {
    socket.emit('join', token)
    Reveal.on('slidechanged', event => {
        // event.previousSlide, event.currentSlide, event.indexh, event.indexv
        const { indexh, indexv, currentSlide } = event;
        socket.emit('page-change', token, indexh, indexv, currentSlide);
        console.log(event)
    });

    socket.on('server-page-change', (indexh, indexv, currentSlide) => {
        console.log(indexh, indexv, currentSlide, "pushed here")
        console.log(socket.rooms)
        Reveal.slide(indexh, indexv, currentSlide);
    })
}
