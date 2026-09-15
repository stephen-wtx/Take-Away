/**
 * TAKE AWAY RUI JÚNIOR - DADOS INICIAIS (SEED DATA)
 * Estrutura inicial de produtos, categorias e horários para o LocalStorage
 */

const INITIAL_CATEGORIES = [
  { id: 'hamburguer', nome: 'Hambúrguer', ativo: true },
  { id: 'pizza', nome: 'Pizza', ativo: true },
  { id: 'sandes', nome: 'Sandes', ativo: true },
  { id: 'cachorro-quente', nome: 'Cachorro Quente', ativo: true }
];

const INITIAL_PRODUCTS = [
  {
    id: 'prod-1',
    nome: 'Hambúrguer',
    descricao: 'Hambúrguer suculento preparado com carne selecionada, queijo derretido e vegetais frescos.',
    preco: 350,
    imagem: 'assets/imgs/menu/men1.png',
    categoria: 'hamburguer',
    disponivel: true
  },
  {
    id: 'prod-2',
    nome: 'Pizza',
    descricao: 'Pizza artesanal crocante com queijo mozzarella, molho de tomate especial e coberturas selecionadas.',
    preco: 550,
    imagem: 'assets/imgs/menu/men4.png',
    categoria: 'pizza',
    disponivel: true
  },
  {
    id: 'prod-3',
    nome: 'Sandes',
    descricao: 'Sandes tostada com pão rústico, recheio generoso e ingredientes frescos de primeira qualidade.',
    preco: 250,
    imagem: 'assets/imgs/menu/men2.png',
    categoria: 'sandes',
    disponivel: true
  },
  {
    id: 'prod-4',
    nome: 'Cachorro Quente',
    descricao: 'Cachorro quente saboroso com salsicha premium, molhos especiais e acompanhamentos crocantes.',
    preco: 200,
    imagem: 'assets/imgs/menu/men3.png',
    categoria: 'cachorro-quente',
    disponivel: true
  }
];

const INITIAL_HOURS = {
  segunda: { dia: 'Segunda-feira', aberto: true, abertura: '08:00', fecho: '22:00' },
  terca:   { dia: 'Terça-feira',   aberto: true, abertura: '08:00', fecho: '22:00' },
  quarta:  { dia: 'Quarta-feira',  aberto: true, abertura: '08:00', fecho: '22:00' },
  quinta:  { dia: 'Quinta-feira',  aberto: true, abertura: '08:00', fecho: '22:00' },
  sexta:   { dia: 'Sexta-feira',   aberto: true, abertura: '08:00', fecho: '23:30' },
  sabado:  { dia: 'Sábado',        aberto: true, abertura: '09:00', fecho: '23:30' },
  domingo: { dia: 'Domingo',       aberto: true, abertura: '09:00', fecho: '22:00' }
};
