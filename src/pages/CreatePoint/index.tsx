import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import Modal from 'react-modal';

import api from '../../services/api';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';

import './styles.css';
import logo from '../../assets/logo.svg';
import completed from '../../assets/completed.svg';

interface Item {
    id: number;
    title: string;
    image_url: string;
}

interface UF {
    sigla: string;
}

interface City {
    nome: string;
}

interface FormData {
    entityName: string;
    email: string;
    whatsapp: string;
}

const CreatePoint = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [selectedUf, setSelectedUf] = useState('0');
    const [cities, setCities] = useState<string[]>([]);
    const [selectedCity, setSelectedCity] = useState('0');
    const [initialPosition, setInicialPosition] = useState<[number, number]>([0, 0]);
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
    const [entityName, setEntityName] = useState('');
    const [email, setEmail] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [modalIsOpen, setModalIsOpen] = useState(false);

    const history = useHistory();

    const modalStyles = {
        content : {
          display               : 'flex',
          justifyContent        : 'center',
          alignItems            : 'center',
          top                   : '50%',
          left                  : '50%',
          right                 : 'auto',
          bottom                : 'auto',
          marginRight           : '-100%',
          transform             : 'translate(-50%, -50%)',
          width                 : '100%',
          height                : '100%',
          background            : '#0E0A14',
          opacity               : '0.90',
        }
      };

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude} = position.coords;

            setInicialPosition([latitude, longitude]);
        });
    }, []);

    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data.serializedItems);
        });
    }, [items]);

    useEffect(() => {
        axios.get<UF[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
            const ufInitials = response.data.map(uf => uf.sigla);

            setUfs(ufInitials);
        });
    }, []);

    useEffect(() => {
        if(selectedUf === '0') return;

        axios.get<City[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(response => {
            const cityNames = response.data.map(city => city.nome);

            setCities(cityNames);
        });

        
    }, [selectedUf]);

    function handleSelectedUf(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedUf(event.target.value);
    }
    
    function handleSelectedCity(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedCity(event.target.value);
    }

    function handleMapClick(event: LeafletMouseEvent) {
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng
        ]);
    }

    async function handleFormSubmit(event: FormEvent) {
        event.preventDefault();

        const data = { 
            name: entityName,
            email,
            whatsapp,
            uf: selectedUf,
            city: selectedCity,
            latitude: selectedPosition[0],
            longitude: selectedPosition[1],
            items: selectedItems
        }

        try {
            await api.post('points', data);
        } catch (error) {
            alert(`error: ${error}`);
        }
        
        openModal();
    }

    function handleSelectItem(id: number) {
        const alreadySelected = selectedItems.findIndex(item => item === id);

        if(alreadySelected >= 0) {
            const filteredItems = selectedItems.filter(item => item !== id);

            setSelectedItems(filteredItems);
        }else {
            setSelectedItems([...selectedItems, id]);
        }
    }

    function openModal() {
        setModalIsOpen(true);
        setTimeout(() => {
            closeModal();
        }, 3500);
    }

    function closeModal() {
        setModalIsOpen(false);
        history.push('/');
    }

    return (
        <div style={{position: 'relative'}}>
        <Modal isOpen={modalIsOpen} style={modalStyles}>
            <img src={completed} alt="Registration Completed" style={{userSelect: 'none'}}/>
        </Modal>
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>

                <Link to="/">
                    <FiArrowLeft />
                    Voltar para home
                </Link>
            </header>

            <form onSubmit={handleFormSubmit}>
                <h1>Cadastro do <br /> ponto de coleta</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da Entidade</label>
                        <input type="text" name="name" id="name" onChange={(e) => setEntityName(e.target.value)} required />
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input type="email" name="email" id="email" onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input type="text" name="whatsapp" id="whatsapp" onChange={(e) => setWhatsapp(e.target.value)} required />
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker position={selectedPosition}/>
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select name="uf" id="uf" value={selectedUf} onChange={handleSelectedUf} required>
                                <option value="0">Selecione uma UF</option>
                                {
                                    ufs.map(uf => {
                                        return (
                                            <option key={uf} value={uf}>{uf}</option>
                                        );
                                    })
                                }
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="city" value={selectedCity} onChange={handleSelectedCity} required>
                                <option value="0">Selecione uma cidade</option>
                                {
                                    cities.map(city => {
                                        return (
                                            <option key={city} value={city}>{city}</option>
                                        );
                                    })
                                }
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Ítens de coleta</h2>
                        <span>Selecione um ou mais ítens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        {
                            items.map(item => {
                                return (
                                    <li key={item.id} onClick={() => handleSelectItem(item.id)} className={selectedItems.includes(item.id) ? 'selected' : ''}>
                                        <img src={item.image_url} alt={item.title}/>
                                        <span>{item.title}</span>
                                    </li>
                                );
                            })
                        }
                    </ul>
                </fieldset>

                <button type="submit">
                    Cadastrar ponto de coleta
                </button>
            </form>
        </div>
        </div>
    );
}

export default CreatePoint;