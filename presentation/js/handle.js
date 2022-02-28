const API_URI = `http://${window.location.hostname}:4000`;
const FRONTEND_URI = 'http://localhost:3000'
const instance = axios.create({
    baseURL: API_URI,

})
const slidesParent = document.querySelector('.slides');
const title = document.querySelector('title');
const query = new URLSearchParams(window.location.search);
const presentationId = query.get('pres');
const token = query.get('token');
const feature = query.get('feature');
const live = feature === "live-share";
const off = feature === "offline"
const presentationPath = '/api/presentation'
const questionPath = '/api/question'
async function getPresentation(ID) {
    const response = await instance.get(presentationPath + `/${ID}?token=${token}`);
    const { data } = response;
    return data;
}
async function main(ID) {
    try {

        const { presention, verify } = await getPresentation(ID)
        console.log(`Presentation response`, presention)
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
            autoPlayMedia: false,
            slideNumber: true,
            help: true,
            plugins: [RevealMarkdown, RevealHighlight, RevealMenu],

        });
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


        plugins: [RevealMarkdown, RevealHighlight],

    });


}
async function visualizeSlides(slides) {
    try {
        if (!slides.length) return;

        for (let slide of slides) {
            const slidePath = API_URI + "/" + slide.path;
            const slideSection = document.createElement('section');
            const h4 = document.createElement('h4');
            if (slide.name) {
                h4.innerText = slide.name;
                slideSection.appendChild(h4);
            }
            if (slide.type === 'image') {
                const cachedPath = await saveMedia(slidePath)
                if (slidePath.endsWith('.pdf')) {
                    slideSection.setAttribute('data-background-iframe', cachedPath);
                    h4.style = "display:none;"
                } else {
                    slideSection.setAttribute('data-background-image', cachedPath);

                }
            }
            else if (slide.type === 'video') {
                const video = document.createElement('video');
                video.src = await saveMedia(slidePath);
                video.controls = true

                slideSection.appendChild(video);
                slideSection.id = 'video-section';






            }
            else if (slide.type === 'audio') {
                const audio = document.createElement('audio');
                audio.controls = true;
                audio.src = await saveMedia(slidePath);
                slideSection.appendChild(audio);


            }
            else if (slide.type === 'html') {
                const cachedPath = slidePath
                slideSection.setAttribute('data-background-iframe', cachedPath);
                h4.style = "display:none"

            }
            else if (slide.type === 'question') {
                let isVoted = false;
                const VotingSection = document.createElement('section');
                VotingSection.setAttribute('id', "votingSection")
                const qr = document.createElement('div');
                const ul = document.createElement('ul');
                const radioUl = document.createElement('ul');
                const form = document.createElement('form');
                const submitButton = document.createElement('input');
                submitButton.type = 'submit';
                submitButton.
                    setAttribute('class', "py-2 px-4 cursor-pointer  bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 focus:ring-offset-indigo-200 text-white ml-2 transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2  rounded-lg")
                for (let opt of slide.options) {
                    const label = document.createElement('label');
                    const radio = document.createElement('input');
                    radio.setAttribute('value', opt);
                    radio.setAttribute('type', "radio");
                    radio.setAttribute('name', slide.name);
                    label.setAttribute('class', "flex items-center justify-center")
                    radio.setAttribute('class', "w-10 h-10 cursor-pointer")
                    label.append(radio)

                    label.append(opt);
                    radioUl.append(label)
                }
                form.append(radioUl)
                form.append(submitButton)
                form.id = "answer-form"
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    if (isVoted) return alert("already voted !");
                    const value = document.querySelector(`input[name="${slide.name}"]:checked`).value;;
                    const res = await axios.get(API_URI + questionPath + `-answer/${slide._id}?answer=${value}&token=${token}`);
                    const { data } = res;
                    console.log(data);
                    if (data.success) isVoted = true;
                    alert(data.message);

                })
                qr.style.display = "inline-block"
                new QRCode(qr, `${FRONTEND_URI}/question?ID=${slide._id}&token=${token}`)
                h4.appendChild(qr);
                h4.style = "display:flex;align-items:center;justify-content :space-evenly"
                slideSection.appendChild(form)


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
                    ul.setAttribute('id', slide._id)
                    VotingSection.setAttribute('question-id', slide._id)
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
    catch (err) {
        console.log(err.message)
    }
}


main(presentationId)
Reveal.on('slidechanged', async (event) => {
    const { indexh, indexv, currentSlide } = event;
    const questionId = currentSlide.getAttribute('question-id');
    if (questionId) {
        const ul = document.getElementById(questionId);
        const res = await axios.get(API_URI + questionPath + `/${questionId}`);
        const { data } = res;
        const { question } = data;
        const answers = question.answers;
        if (answers.length) {
            if (ul) ul.innerHTML = ""
            for (let answer of answers) {
                const { option, votes } = answer;
                const li = document.createElement('li');
                li.innerText = `${option}: ${votes}`;
                ul.append(li)
            }
        }
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



